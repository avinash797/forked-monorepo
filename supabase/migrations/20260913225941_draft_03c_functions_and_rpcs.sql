-- ---------- get_rank_delta ----------
CREATE OR REPLACE FUNCTION public.get_rank_delta(p_restaurant_id uuid, p_dish_type_id uuid, p_city_id uuid, p_period text DEFAULT 'week'::text, p_scope text DEFAULT 'city'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_days          INTEGER;
    v_current_rank  INTEGER;
    v_past_rank     INTEGER;
    v_current_score NUMERIC;
    v_past_score    NUMERIC;
BEGIN
    v_days := CASE p_period
        WHEN 'day'   THEN 1
        WHEN 'week'  THEN 7
        WHEN 'month' THEN 30
        WHEN 'year'  THEN 365
        ELSE 7
    END;

    -- Most recent snapshot
    SELECT rank_position, bayesian_score
    INTO v_current_rank, v_current_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Closest snapshot at or before the period boundary
    SELECT rank_position, bayesian_score
    INTO v_past_rank, v_past_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date <= CURRENT_DATE - v_days
    ORDER BY snapshot_date DESC
    LIMIT 1;

    IF v_current_rank IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'current_rank',  v_current_rank,
        'past_rank',     v_past_rank,
        'rank_delta',    CASE WHEN v_past_rank IS NOT NULL
                              THEN v_past_rank - v_current_rank
                              ELSE NULL END,
        'current_score', ROUND(v_current_score, 1),
        'past_score',    CASE WHEN v_past_score IS NOT NULL
                              THEN ROUND(v_past_score, 1)
                              ELSE NULL END,
        'period',        p_period,
        'trend',         CASE
                           WHEN v_past_rank IS NULL              THEN 'new'
                           WHEN v_past_rank > v_current_rank     THEN 'up'
                           WHEN v_past_rank < v_current_rank     THEN 'down'
                           ELSE 'stable'
                         END
    );
END;
$function$;

-- ---------- get_rank_history ----------
CREATE OR REPLACE FUNCTION public.get_rank_history(p_restaurant_id uuid, p_dish_type_id uuid, p_city_id uuid, p_days integer DEFAULT 30, p_scope text DEFAULT 'city'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_results JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'snapshot_date',  snapshot_date,
            'rank_position',  rank_position,
            'bayesian_score', FLOOR(bayesian_score * 10) / 10,
            'total_ratings',  total_ratings,
            'confidence_tier', confidence_tier
        )
        ORDER BY snapshot_date ASC
    )
    INTO v_results
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date >= CURRENT_DATE - p_days;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_user_badges ----------
CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
RETURN COALESCE(
    (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    bd.id,
                    'slug',
                    bd.slug,
                    'name',
                    bd.name,
                    'description',
                    bd.description,
                    'image_url',
                    bd.image_url,
                    'category',
                    bd.category,
                    'dish_type_id',
                    bd.dish_type_id,
                    'threshold',
                    bd.threshold,
                    'is_active',
                    bd.is_active,
                    'is_featured',
                    bd.is_featured,
                    'sort_order',
                    bd.sort_order,
                    'earned_at',
                    ub.earned_at,
                    'notified',
                    ub.notified
                )
                ORDER BY bd.is_featured DESC,
                    bd.sort_order,
                    bd.created_at
            )
        FROM badge_definitions bd
            LEFT JOIN user_badges ub ON ub.badge_id = bd.id
            AND ub.user_id = v_user_id
        WHERE bd.is_active = true
            OR ub.id IS NOT NULL
    ),
    '[]'::JSONB
);
END;
$function$;

-- ---------- get_user_stats ----------
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_result JSONB;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT jsonb_build_object(
        'user_id',
        p.id,
        'username',
        p.username,
        'total_ratings',
        p.total_ratings,
        'total_comparisons',
        p.total_comparisons,
        'credibility_score',
        p.credibility_score,
        'dishes_by_type',
        (
            SELECT jsonb_object_agg(dt.name, cnt)
            FROM (
                    SELECT dish_type_id,
                        COUNT(*) AS cnt
                    FROM public.personal_ratings
                    WHERE user_id = v_user_id
                    GROUP BY dish_type_id
                ) r
                JOIN public.dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',
        (
            SELECT COUNT(DISTINCT r.city_id)
            FROM public.personal_ratings pr
                JOIN public.restaurants r ON r.id = pr.restaurant_id
            WHERE pr.user_id = v_user_id
        ),
        'member_since',
        p.created_at,
        'skip_rate',
        (
            SELECT ROUND(
                    COUNT(*) FILTER (
                        WHERE result = 'skipped'
                    )::DECIMAL / NULLIF(COUNT(*), 0),
                    3
                )
            FROM public.comparisons
            WHERE user_id = v_user_id
        )
    ) INTO v_result
FROM public.profiles p
WHERE p.id = v_user_id;
RETURN v_result;
END;
$function$;

-- ---------- match_location ----------
CREATE OR REPLACE FUNCTION public.match_location(lat double precision, long double precision)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE _city_record public.cities %ROWTYPE;
_neighborhood_record public.neighborhoods %ROWTYPE;
_point extensions.geometry;
BEGIN _point := st_setsrid(st_point(long, lat), 4326);
SELECT * INTO _city_record
FROM public.cities
WHERE is_active = true
    AND st_contains(coordinates::extensions.geometry, _point)
LIMIT 1;
IF _city_record IS NULL THEN
SELECT * INTO _city_record
FROM public.cities
WHERE is_active = true
ORDER BY coordinates::extensions.geometry <->_point
LIMIT 1;
END IF;
IF _city_record IS NOT NULL THEN
SELECT * INTO _neighborhood_record
FROM public.neighborhoods
WHERE city_id = _city_record.id
    AND st_contains(boundary::extensions.geometry, _point)
LIMIT 1;
END IF;
RETURN json_build_object(
    'city',
    CASE
        WHEN _city_record IS NULL THEN NULL
        ELSE json_build_object(
            'id',
            _city_record.id,
            'name',
            _city_record.name,
            'state',
            _city_record.state,
            'slug',
            _city_record.slug
        )
    END,
    'neighborhood',
    CASE
        WHEN _neighborhood_record IS NULL THEN NULL
        ELSE json_build_object(
            'id',
            _neighborhood_record.id,
            'name',
            _neighborhood_record.name,
            'slug',
            _neighborhood_record.slug
        )
    END
);
END;
$function$;

-- ---------- report_content ----------
CREATE OR REPLACE FUNCTION public.report_content(p_reported_rating_id uuid, p_reason text, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_reporter_id UUID := auth.uid();
    v_report_id UUID;
    v_existing UUID;
BEGIN
    -- Check auth
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check the rating exists
    IF NOT EXISTS (SELECT 1 FROM personal_ratings WHERE id = p_reported_rating_id) THEN
        RAISE EXCEPTION 'Rating not found';
    END IF;

    -- Prevent self-reporting
    IF EXISTS (
        SELECT 1 FROM personal_ratings
        WHERE id = p_reported_rating_id AND user_id = v_reporter_id
    ) THEN
        RAISE EXCEPTION 'Cannot report your own content';
    END IF;

    -- Check for duplicate
    SELECT id INTO v_existing
    FROM content_reports
    WHERE reporter_id = v_reporter_id
      AND reported_rating_id = p_reported_rating_id;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('success', true, 'already_reported', true);
    END IF;

    -- Insert report
    INSERT INTO content_reports (reporter_id, reported_rating_id, reason, description)
    VALUES (v_reporter_id, p_reported_rating_id, p_reason::report_reason, p_description)
    RETURNING id INTO v_report_id;

    RETURN json_build_object('success', true, 'report_id', v_report_id);
END;
$function$;

-- ---------- search_dish_types ----------
CREATE OR REPLACE FUNCTION public.search_dish_types(search_term text)
 RETURNS SETOF dish_types
 LANGUAGE sql
 STABLE
AS $function$
SELECT *
FROM public.dish_types
WHERE is_active = true
    AND (
        similarity(name, search_term) > 0.15
        OR similarity(replace(name, ' ', ''), search_term) > 0.15
        OR name ILIKE '%' || search_term || '%'
        OR EXISTS (
            SELECT 1
            FROM unnest(aliases) alias
            WHERE alias ILIKE '%' || search_term || '%'
                OR similarity(alias, search_term) > 0.15
        )
    )
ORDER BY greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- search_restaurant_dishes ----------
CREATE OR REPLACE FUNCTION public.search_restaurant_dishes(search_term text)
 RETURNS TABLE(restaurant_dish_id uuid, dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, restaurant_id uuid, restaurant_name text, photos text[], total_ratings integer)
 LANGUAGE sql
 STABLE
AS $function$
SELECT rd.id,
    dt.id,
    dt.name,
    dt.emoji,
    dt.icon,
    r.id,
    r.name,
    rd.photos,
    rd.total_ratings
FROM public.restaurant_dishes rd
    JOIN public.dish_types dt ON dt.id = rd.dish_type_id
    JOIN public.restaurants r ON r.id = rd.restaurant_id
WHERE similarity(dt.name, search_term) > 0.15
    OR similarity(replace(dt.name, ' ', ''), search_term) > 0.15
    OR dt.name ILIKE '%' || search_term || '%'
ORDER BY greatest(
        similarity(dt.name, search_term),
        similarity(replace(dt.name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- search_restaurants ----------
CREATE OR REPLACE FUNCTION public.search_restaurants(search_term text)
 RETURNS SETOF restaurants
 LANGUAGE sql
 STABLE
AS $function$
SELECT *
FROM public.restaurants
WHERE similarity(name, search_term) > 0.15
    OR similarity(replace(name, ' ', ''), search_term) > 0.15
    OR name ILIKE '%' || search_term || '%'
ORDER BY greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- slugify ----------
CREATE OR REPLACE FUNCTION public.slugify(v_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$ BEGIN RETURN lower(
        regexp_replace(
            regexp_replace(v_text, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
        )
    );
END;
$function$;
