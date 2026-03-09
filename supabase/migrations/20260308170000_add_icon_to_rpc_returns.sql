-- Add dish_type_icon to RPC functions that previously only returned emoji.
-- Logic is identical; only the return type and SELECT list are extended.
-- Must drop first because PostgreSQL cannot replace a function with a different return type.

DROP FUNCTION IF EXISTS public.get_my_best_ever(UUID);
DROP FUNCTION IF EXISTS public.get_discover_rising_stars(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, DECIMAL, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.search_restaurant_dishes(TEXT);

-- ============================================================
-- PERSONAL: get_my_best_ever
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id UUID DEFAULT NULL) RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        dish_type_icon TEXT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        sentiment TEXT,
        derived_score NUMERIC,
        photo_url TEXT,
        rated_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
RETURN QUERY
SELECT DISTINCT ON (pr.dish_type_id) pr.dish_type_id,
    dt.name AS dish_type_name,
    dt.emoji AS dish_type_emoji,
    dt.icon AS dish_type_icon,
    pr.id AS rating_id,
    pr.restaurant_id,
    r.name AS restaurant_name,
    c.name AS city_name,
    pr.sentiment,
    pr.derived_score,
    pr.photo_url,
    pr.created_at AS rated_at
FROM public.personal_ratings pr
    JOIN public.dish_types dt ON dt.id = pr.dish_type_id
    JOIN public.restaurants r ON r.id = pr.restaurant_id
    LEFT JOIN public.cities c ON c.id = r.city_id
WHERE pr.user_id = v_user_id
    AND pr.derived_score IS NOT NULL
ORDER BY pr.dish_type_id,
    pr.derived_score DESC NULLS LAST;
END;
$$;

-- ============================================================
-- DISCOVER: get_discover_rising_stars
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(
        p_city_name TEXT DEFAULT NULL,
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
    LEFT JOIN public.cities c ON c.id = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.bayesian_score >= p_min_score
    AND gds.total_ratings < p_max_ratings
    AND gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
    AND (
        p_city_name IS NULL
        OR c.name ILIKE p_city_name
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

-- ============================================================
-- SEARCH: search_restaurant_dishes
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_restaurant_dishes(search_term TEXT) RETURNS TABLE (
        restaurant_dish_id UUID,
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        dish_type_icon TEXT,
        restaurant_id UUID,
        restaurant_name TEXT,
        photos TEXT [],
        total_ratings INTEGER
    ) LANGUAGE SQL STABLE AS $$
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
$$;
