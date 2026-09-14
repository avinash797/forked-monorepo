-- ---------- delete_user_account ----------
CREATE OR REPLACE FUNCTION public.delete_user_account(p_confirm boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_ratings_count INTEGER;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
IF NOT p_confirm THEN RAISE EXCEPTION 'Must confirm deletion by passing p_confirm = true';
END IF;
SELECT COUNT(*) INTO v_ratings_count
FROM public.personal_ratings
WHERE user_id = v_user_id;
DELETE FROM public.personal_ratings
WHERE user_id = v_user_id;
DELETE FROM public.comparisons
WHERE user_id = v_user_id;
DELETE FROM public.profiles
WHERE id = v_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'user_id',
    v_user_id,
    'ratings_deleted',
    v_ratings_count,
    'note',
    'Profile and ratings deleted. Auth account must be deleted separately.'
);
END;
$function$;

-- ---------- evaluate_badges ----------
CREATE OR REPLACE FUNCTION public.evaluate_badges(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_badge RECORD;
v_count INTEGER;
v_earned BOOLEAN;
v_inserted UUID;
v_new_badges JSONB := '[]'::JSONB;
BEGIN FOR v_badge IN
SELECT bd.*
FROM badge_definitions bd
WHERE bd.is_active = true
    AND bd.rule_type != 'manual'
    AND NOT EXISTS (
        SELECT 1
        FROM user_badges ub
        WHERE ub.user_id = p_user_id
            AND ub.badge_id = bd.id
    )
ORDER BY bd.sort_order LOOP v_earned := false;
v_count := 0;
CASE
    v_badge.rule_type
    WHEN 'total_ratings' THEN
    SELECT COUNT(*) INTO v_count
    FROM personal_ratings
    WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_type_count' THEN
SELECT COUNT(*) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id
    AND dish_type_id = v_badge.dish_type_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'total_comparisons' THEN
SELECT COUNT(*) INTO v_count
FROM comparisons
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'cities_count' THEN
SELECT COUNT(DISTINCT r.city_id) INTO v_count
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_types_count' THEN
SELECT COUNT(DISTINCT dish_type_id) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
ELSE v_earned := false;
END CASE
;
IF v_earned THEN v_inserted := NULL;
INSERT INTO user_badges (user_id, badge_id)
VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING
RETURNING id INTO v_inserted;
IF v_inserted IS NOT NULL THEN v_new_badges := v_new_badges || jsonb_build_array(
    jsonb_build_object(
        'id',
        v_badge.id,
        'slug',
        v_badge.slug,
        'name',
        v_badge.name,
        'description',
        v_badge.description,
        'image_url',
        v_badge.image_url
    )
);
END IF;
END IF;
END LOOP;
RETURN v_new_badges;
END;
$function$;

-- ---------- find_nearby_restaurants ----------
CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(p_lat double precision, p_long double precision, p_radius_meters double precision DEFAULT 100.0, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, address text, city_id uuid, neighborhood_id uuid, coordinates geography, google_place_id text, phone text, website text, is_verified boolean, is_closed boolean, closed_at timestamp with time zone, types text[], created_at timestamp with time zone, updated_at timestamp with time zone, distance_meters double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_point extensions.geography;
BEGIN v_user_point := extensions.ST_SetSRID(extensions.ST_MakePoint(p_long, p_lat), 4326)::extensions.geography;
RETURN QUERY
SELECT r.id,
    r.name,
    r.address,
    r.city_id,
    r.neighborhood_id,
    r.coordinates,
    r.google_place_id,
    r.phone,
    r.website,
    r.is_verified,
    r.is_closed,
    r.closed_at,
    r.types,
    r.created_at,
    r.updated_at,
    extensions.ST_Distance(r.coordinates, v_user_point) AS distance_meters
FROM public.restaurants r
WHERE r.coordinates IS NOT NULL
    AND extensions.ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
ORDER BY distance_meters ASC
LIMIT p_limit;
END;
$function$;

-- ---------- get_discover_heroes ----------
CREATE OR REPLACE FUNCTION public.get_discover_heroes(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_id UUID;
v_user_point extensions.GEOGRAPHY;
BEGIN v_user_id := auth.uid();
IF p_user_lat IS NOT NULL
AND p_user_long IS NOT NULL THEN v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
END IF;
RETURN QUERY
SELECT gds.id,
    gds.restaurant_id,
    r.name AS restaurant_name,
    gds.dish_type_id,
    gds.city_id,
    gds.neighborhood_id,
    n.name AS neighborhood_name,
    gds.bayesian_score,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.confidence_tier,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
    AND (
        p_city_id IS NULL
        OR gds.city_id = p_city_id
    )
    AND (
        v_user_point IS NULL
        OR p_radius_meters IS NULL
        OR ST_DWithin(
            r.coordinates,
            v_user_point,
            p_radius_meters::double precision
        )
    )
    AND (
        v_user_id IS NULL
        OR NOT EXISTS (
            SELECT 1
            FROM public.personal_ratings pr
            WHERE pr.user_id = v_user_id
                AND pr.restaurant_id = gds.restaurant_id
        )
    )
ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_discover_rising_stars ----------
CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_score numeric DEFAULT 7.5, p_max_ratings integer DEFAULT 10, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_id UUID;
v_user_point extensions.GEOGRAPHY;
BEGIN v_user_id := auth.uid();
IF p_user_lat IS NOT NULL
AND p_user_long IS NOT NULL THEN v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
END IF;
RETURN QUERY
SELECT gds.id,
    gds.restaurant_id,
    r.name AS restaurant_name,
    gds.dish_type_id,
    dt.name AS dish_type_name,
    dt.emoji AS dish_type_emoji,
    dt.icon AS dish_type_icon,
    gds.city_id,
    gds.neighborhood_id,
    n.name AS neighborhood_name,
    gds.bayesian_score,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.confidence_tier,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    JOIN public.dish_types dt ON dt.id = gds.dish_type_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.bayesian_score >= p_min_score
    AND gds.total_ratings < p_max_ratings
    AND gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
    AND (
        p_city_id IS NULL
        OR gds.city_id = p_city_id
    )
    AND (
        v_user_point IS NULL
        OR p_radius_meters IS NULL
        OR ST_DWithin(
            r.coordinates,
            v_user_point,
            p_radius_meters::double precision
        )
    )
    AND (
        v_user_id IS NULL
        OR NOT EXISTS (
            SELECT 1
            FROM public.personal_ratings pr
            WHERE pr.user_id = v_user_id
                AND pr.restaurant_id = gds.restaurant_id
        )
    )
ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_dish_type_entry_counts ----------
CREATE OR REPLACE FUNCTION public.get_dish_type_entry_counts(p_city_id uuid)
 RETURNS TABLE(dish_type_id uuid, entry_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT dish_type_id, COUNT(*)::BIGINT AS entry_count
    FROM public.global_dish_scores
    WHERE city_id = p_city_id
      AND total_ratings >= 2
    GROUP BY dish_type_id;
$function$;

-- ---------- get_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_dish_type_id uuid, p_city_id uuid, p_neighborhood_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_results JSONB;
BEGIN
SELECT jsonb_agg(
        row_data
        ORDER BY rank_num
    ) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',
                ROW_NUMBER() OVER (
                    ORDER BY gds.bayesian_score DESC
                ),
                'restaurant_id',
                r.id,
                'restaurant_name',
                r.name,
                'address',
                r.address,
                'neighborhood_name',
                n.name,
                'bayesian_score',
                FLOOR(gds.bayesian_score * 10) / 10,
                'total_ratings',
                gds.total_ratings,
                'confidence_tier',
                gds.confidence_tier,
                'featured_photo_url',
                gds.featured_photo_url
            ) AS row_data,
            ROW_NUMBER() OVER (
                ORDER BY gds.bayesian_score DESC
            ) AS rank_num
        FROM global_dish_scores gds
            JOIN restaurants r ON r.id = gds.restaurant_id
            LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
        WHERE gds.dish_type_id = p_dish_type_id
            AND gds.city_id = p_city_id
            AND (
                p_neighborhood_id IS NULL
                OR gds.neighborhood_id = p_neighborhood_id
            )
            AND gds.total_ratings >= 2
        ORDER BY gds.bayesian_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_my_best_ever ----------
CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, rating_id uuid, restaurant_id uuid, restaurant_name text, city_name text, neighborhood_name text, variation_name text, sentiment text, derived_score numeric, photo_url text, rated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;
    RETURN QUERY
    SELECT DISTINCT ON (pr.dish_type_id)
        pr.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        dt.icon AS dish_type_icon,
        pr.id AS rating_id,
        pr.restaurant_id,
        r.name AS restaurant_name,
        c.name AS city_name,
        n.name AS neighborhood_name,
        dtv.name AS variation_name,
        pr.sentiment,
        pr.derived_score,
        COALESCE(pr.photo_url, dt.placeholder_photo_url) AS photo_url,
        pr.created_at AS rated_at
    FROM public.personal_ratings pr
        JOIN public.dish_types dt ON dt.id = pr.dish_type_id
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        LEFT JOIN public.cities c ON c.id = r.city_id
        LEFT JOIN public.neighborhoods n ON n.id = r.neighborhood_id
        LEFT JOIN public.dish_type_variations dtv ON dtv.id = pr.variation_id
    WHERE pr.user_id = v_user_id
        AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_nearby_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(p_latitude double precision, p_longitude double precision, p_radius_meters integer, p_dish_type_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, restaurant_id uuid, restaurant_name text, neighborhood_name text, distance_meters double precision, bayesian_score numeric, confidence_tier text, raw_weighted_avg numeric, total_ratings integer, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_point extensions.GEOGRAPHY;
BEGIN v_user_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY gds.bayesian_score DESC
    )::BIGINT AS rank,
    gds.restaurant_id,
    r.name AS restaurant_name,
    n.name AS neighborhood_name,
    ST_Distance(r.coordinates, v_user_point) AS distance_meters,
    gds.bayesian_score,
    gds.confidence_tier,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.dish_type_id = p_dish_type_id
    AND ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
    AND gds.total_ratings >= 2
    AND r.is_closed = false
ORDER BY gds.bayesian_score DESC
LIMIT p_limit;
END;
$function$;

-- ---------- get_personal_dish_type_counts ----------
CREATE OR REPLACE FUNCTION public.get_personal_dish_type_counts(p_user_id uuid DEFAULT NULL::uuid)
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
SELECT jsonb_object_agg(dt.name, cnt) INTO v_result
FROM (
        SELECT dish_type_id,
            COUNT(*) AS cnt
        FROM public.personal_ratings
        WHERE user_id = v_user_id
        GROUP BY dish_type_id
    ) r
    JOIN public.dish_types dt ON dt.id = r.dish_type_id;
RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

-- ---------- get_personal_rankings ----------
CREATE OR REPLACE FUNCTION public.get_personal_rankings(p_dish_type_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_results JSONB;
BEGIN
SELECT jsonb_agg(row_data ORDER BY rank_num) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',             ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC),
                'rating_id',        pr.id,
                'restaurant_id',    r.id,
                'restaurant_name',  r.name,
                'elo_score',        pr.elo_score,
                'derived_score',    pr.derived_score,
                'sentiment',        pr.sentiment,
                'photo_url',        COALESCE(pr.photo_url, dt.placeholder_photo_url),
                'comparison_count', pr.comparison_count,
                'notes',            pr.notes,
                'rated_at',         pr.updated_at,
                'variation_name',   dtv.name,
                'neighborhood_name', n.name,
                'city_name',        c.name
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC) AS rank_num
        FROM personal_ratings pr
            JOIN restaurants r ON r.id = pr.restaurant_id
            JOIN dish_types dt ON dt.id = pr.dish_type_id
            LEFT JOIN dish_type_variations dtv ON dtv.id = pr.variation_id
            LEFT JOIN neighborhoods n ON n.id = r.neighborhood_id
            LEFT JOIN cities c ON c.id = r.city_id
        WHERE pr.user_id = v_user_id
            AND pr.dish_type_id = p_dish_type_id
            AND pr.battle_status = 'completed'
        ORDER BY pr.elo_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;
