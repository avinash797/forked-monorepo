-- Fix: Switch discover RPCs from p_city_name (TEXT, ILIKE) to p_city_id (UUID, exact match).
-- This is more correct (city names aren't unique identifiers) and more performant
-- (direct UUID equality vs. case-insensitive string comparison + cities JOIN for filtering).

-- Must drop get_discover_heroes because we're changing parameter types
DROP FUNCTION IF EXISTS public.get_discover_heroes(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_discover_heroes(
        p_city_id UUID DEFAULT NULL,
        p_user_lat DOUBLE PRECISION DEFAULT NULL,
        p_user_long DOUBLE PRECISION DEFAULT NULL,
        p_radius_meters INTEGER DEFAULT NULL,
        p_min_ratings INTEGER DEFAULT 2
    ) RETURNS TABLE (
        id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        dish_type_id UUID,
        city_id UUID,
        neighborhood_id UUID,
        neighborhood_name TEXT,
        bayesian_score NUMERIC,
        raw_weighted_avg NUMERIC,
        total_ratings INTEGER,
        confidence_tier TEXT,
        featured_photo_url TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
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
$$;

-- Must drop get_discover_rising_stars because we're changing parameter types
DROP FUNCTION IF EXISTS public.get_discover_rising_stars(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, DECIMAL, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(
        p_city_id UUID DEFAULT NULL,
        p_user_lat DOUBLE PRECISION DEFAULT NULL,
        p_user_long DOUBLE PRECISION DEFAULT NULL,
        p_radius_meters INTEGER DEFAULT NULL,
        p_min_score DECIMAL DEFAULT 7.5,
        p_max_ratings INTEGER DEFAULT 10,
        p_min_ratings INTEGER DEFAULT 2
    ) RETURNS TABLE (
        id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        dish_type_icon TEXT,
        city_id UUID,
        neighborhood_id UUID,
        neighborhood_name TEXT,
        bayesian_score NUMERIC,
        raw_weighted_avg NUMERIC,
        total_ratings INTEGER,
        confidence_tier TEXT,
        featured_photo_url TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
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
$$;
