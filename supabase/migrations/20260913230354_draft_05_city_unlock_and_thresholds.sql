-- ============================================================
-- DRAFT 05 — US-wide pivot: threshold-gated city unlocks
-- ============================================================

-- 1. Threshold constants + unlock bookkeeping
INSERT INTO public.app_constants (key, value, description) VALUES
    ('LEADERBOARD_MIN_RATERS',    2, 'Distinct completed ratings required for a leaderboard entry to qualify'),
    ('CITY_UNLOCK_MIN_ENTRIES',   3, 'Qualifying entries required in a single dish type to unlock a city'),
    ('CITY_UNLOCK_MIN_DISH_TYPES',1, 'Dish types that must meet CITY_UNLOCK_MIN_ENTRIES to unlock a city')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

UPDATE public.cities
SET unlocked_at = COALESCE(unlocked_at, now())
WHERE is_active = true;

-- ---------- _get_constant (internal helper) ----------
CREATE OR REPLACE FUNCTION public._get_constant(p_key TEXT, p_default NUMERIC)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE((SELECT value FROM app_constants WHERE key = p_key), p_default);
$function$;

REVOKE EXECUTE ON FUNCTION public._get_constant(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;

-- 2. Configurable leaderboard qualification threshold

-- ---------- get_dish_type_entry_counts ----------
CREATE OR REPLACE FUNCTION public.get_dish_type_entry_counts(p_city_id uuid)
 RETURNS TABLE(dish_type_id uuid, entry_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT dish_type_id, COUNT(*)::BIGINT AS entry_count
    FROM public.global_dish_scores
    WHERE city_id = p_city_id
      AND total_ratings >= public._get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER
    GROUP BY dish_type_id;
$function$;

-- ---------- get_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_dish_type_id uuid, p_city_id uuid, p_neighborhood_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_results JSONB;
    v_min_raters INTEGER := _get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER;
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
            AND gds.total_ratings >= v_min_raters
        ORDER BY gds.bayesian_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_nearby_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(p_latitude double precision, p_longitude double precision, p_radius_meters integer, p_dish_type_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, restaurant_id uuid, restaurant_name text, neighborhood_name text, distance_meters double precision, bayesian_score numeric, confidence_tier text, raw_weighted_avg numeric, total_ratings integer, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user_point extensions.GEOGRAPHY;
    v_min_raters INTEGER := public._get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER;
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
    AND gds.total_ratings >= v_min_raters
    AND r.is_closed = false
ORDER BY gds.bayesian_score DESC
LIMIT p_limit;
END;
$function$;

-- ---------- take_leaderboard_snapshot ----------
CREATE OR REPLACE FUNCTION public.take_leaderboard_snapshot(p_snapshot_date date DEFAULT CURRENT_DATE)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_inserted   INTEGER := 0;
    v_batch      INTEGER;
    v_min_raters INTEGER := _get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER;
BEGIN
    -- City-level: rank within (city_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        NULL,
        RANK() OVER (
            PARTITION BY gds.city_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'city'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= v_min_raters
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    -- Neighborhood-level: rank within (neighborhood_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        RANK() OVER (
            PARTITION BY gds.neighborhood_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'neighborhood'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= v_min_raters
      AND gds.neighborhood_id IS NOT NULL
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    RETURN v_inserted;
END;
$function$;

-- 3. Nightly city unlock (one-way)
CREATE OR REPLACE FUNCTION public.evaluate_city_unlocks()
 RETURNS TABLE(city_id uuid, city_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_min_raters     INTEGER := _get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER;
    v_min_entries    INTEGER := _get_constant('CITY_UNLOCK_MIN_ENTRIES', 3)::INTEGER;
    v_min_dish_types INTEGER := _get_constant('CITY_UNLOCK_MIN_DISH_TYPES', 1)::INTEGER;
BEGIN
    RETURN QUERY
    WITH qualifying AS (
        SELECT gds.city_id AS cid
        FROM global_dish_scores gds
        JOIN restaurants r ON r.id = gds.restaurant_id AND r.is_closed = false
        WHERE gds.total_ratings >= v_min_raters
        GROUP BY gds.city_id, gds.dish_type_id
        HAVING COUNT(*) >= v_min_entries
    ),
    eligible AS (
        SELECT cid FROM qualifying GROUP BY cid HAVING COUNT(*) >= v_min_dish_types
    )
    UPDATE cities c
    SET is_active = true,
        unlocked_at = now()
    FROM eligible e
    WHERE c.id = e.cid
      AND c.is_active = false   -- one-way: never touches already-active cities
    RETURNING c.id, c.name;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.evaluate_city_unlocks() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-city-unlock-eval') THEN
        PERFORM cron.unschedule('nightly-city-unlock-eval');
    END IF;
END;
$$;

SELECT cron.schedule(
    'nightly-city-unlock-eval',
    '30 2 * * *',
    $$SELECT public.evaluate_city_unlocks()$$
);

-- 4. match_location — add city.distance_meters
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
            _city_record.slug,
            'distance_meters',
            extensions.ST_Distance(
                _city_record.coordinates,
                _point::extensions.geography
            )
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

-- 5. get_flagship_board
CREATE OR REPLACE FUNCTION public.get_flagship_board()
 RETURNS TABLE(city_id uuid, city_slug text, city_name text, dish_type_id uuid, dish_type_slug text, dish_type_name text, entry_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT
        c.id   AS city_id,
        c.slug AS city_slug,
        c.name AS city_name,
        dt.id   AS dish_type_id,
        dt.slug AS dish_type_slug,
        dt.name AS dish_type_name,
        COUNT(*)::BIGINT AS entry_count
    FROM public.global_dish_scores gds
    JOIN public.cities c      ON c.id = gds.city_id AND c.is_active = true
    JOIN public.dish_types dt ON dt.id = gds.dish_type_id
    WHERE gds.total_ratings >= public._get_constant('LEADERBOARD_MIN_RATERS', 2)::INTEGER
    GROUP BY c.id, c.slug, c.name, dt.id, dt.slug, dt.name
    ORDER BY COUNT(*) DESC, MAX(gds.bayesian_score) DESC
    LIMIT 1;
$function$;

-- 6. Remove the dead Gemini-enrichment path
DROP FUNCTION IF EXISTS public.check_city_is_new(uuid);
DROP FUNCTION IF EXISTS public.trigger_enrich_city_dish_types();
