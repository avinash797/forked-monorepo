-- ============================================
-- Fix PostGIS search path for discover RPC functions
-- ============================================
-- The previous migration set search_path = public, but PostGIS functions
-- (ST_DWithin, ST_SetSRID, ST_MakePoint) live in the extensions schema.
-- This migration re-creates both functions with search_path = public, extensions.

-- ============================================
-- DISCOVER HEROES (fix search_path)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_discover_heroes(
    p_city_name TEXT DEFAULT NULL,
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_long DOUBLE PRECISION DEFAULT NULL,
    p_radius_meters INTEGER DEFAULT NULL,
    p_min_battles INTEGER DEFAULT 5
) RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    restaurant_name TEXT,
    dish_type_id UUID,
    city_id UUID,
    neighborhood_id UUID,
    neighborhood_name TEXT,
    avg_raw_score DECIMAL,
    total_ratings INTEGER,
    total_battles INTEGER,
    global_elo DECIMAL,
    confidence_score DECIMAL,
    featured_photo_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
    v_user_id UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    -- Get current user (can be null for unauthenticated users)
    v_user_id := auth.uid();

    -- Build user geography point if coordinates provided
    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name AS restaurant_name,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        n.name AS neighborhood_name,
        gds.avg_raw_score,
        gds.total_ratings,
        gds.total_battles,
        gds.global_elo,
        gds.confidence_score,
        gds.featured_photo_url
    FROM global_dish_scores gds
    JOIN restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN cities c ON c.id = gds.city_id
    LEFT JOIN neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.total_battles >= p_min_battles
        AND r.is_closed = false
        -- Location filter: city name match
        AND (
            p_city_name IS NULL
            OR c.name ILIKE p_city_name
        )
        -- Location filter: proximity match
        AND (
            v_user_point IS NULL
            OR p_radius_meters IS NULL
            OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
        )
        -- Exclude restaurants where user has rated any dish
        AND (
            v_user_id IS NULL
            OR NOT EXISTS (
                SELECT 1
                FROM personal_ratings pr
                WHERE pr.user_id = v_user_id
                    AND pr.restaurant_id = gds.restaurant_id
            )
        )
    ORDER BY gds.confidence_score DESC;
END;
$$;
-- ============================================
-- DISCOVER RISING STARS (fix search_path)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(
    p_city_name TEXT DEFAULT NULL,
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_long DOUBLE PRECISION DEFAULT NULL,
    p_radius_meters INTEGER DEFAULT NULL,
    p_min_score DECIMAL DEFAULT 7.5,
    p_max_battles INTEGER DEFAULT 10,
    p_min_ratings INTEGER DEFAULT 2
) RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    restaurant_name TEXT,
    dish_type_id UUID,
    dish_type_name TEXT,
    dish_type_emoji TEXT,
    city_id UUID,
    neighborhood_id UUID,
    neighborhood_name TEXT,
    avg_raw_score DECIMAL,
    total_ratings INTEGER,
    total_battles INTEGER,
    global_elo DECIMAL,
    confidence_score DECIMAL,
    featured_photo_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
    v_user_id UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    -- Get current user (can be null for unauthenticated users)
    v_user_id := auth.uid();

    -- Build user geography point if coordinates provided
    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name AS restaurant_name,
        gds.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        gds.city_id,
        gds.neighborhood_id,
        n.name AS neighborhood_name,
        gds.avg_raw_score,
        gds.total_ratings,
        gds.total_battles,
        gds.global_elo,
        gds.confidence_score,
        gds.featured_photo_url
    FROM global_dish_scores gds
    JOIN restaurants r ON r.id = gds.restaurant_id
    JOIN dish_types dt ON dt.id = gds.dish_type_id
    LEFT JOIN cities c ON c.id = gds.city_id
    LEFT JOIN neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.avg_raw_score >= p_min_score
        AND gds.total_battles < p_max_battles
        AND gds.total_ratings >= p_min_ratings
        AND r.is_closed = false
        -- Location filter: city name match
        AND (
            p_city_name IS NULL
            OR c.name ILIKE p_city_name
        )
        -- Location filter: proximity match
        AND (
            v_user_point IS NULL
            OR p_radius_meters IS NULL
            OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
        )
        -- Exclude restaurants where user has rated any dish
        AND (
            v_user_id IS NULL
            OR NOT EXISTS (
                SELECT 1
                FROM personal_ratings pr
                WHERE pr.user_id = v_user_id
                    AND pr.restaurant_id = gds.restaurant_id
            )
        )
    ORDER BY gds.avg_raw_score DESC;
END;
$$;
-- Update comments
COMMENT ON FUNCTION public.get_discover_heroes IS 'Returns hero dishes for discover page, excluding restaurants user has already rated. Supports city name or proximity-based location filtering.';
COMMENT ON FUNCTION public.get_discover_rising_stars IS 'Returns rising star dishes for discover page, excluding restaurants user has already rated. Supports city name or proximity-based location filtering.';
