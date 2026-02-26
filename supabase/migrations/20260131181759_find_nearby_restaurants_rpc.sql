-- RPC: Find nearby restaurants using PostGIS
-- Returns restaurants within a given radius, sorted by distance

CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(
    p_lat double precision,
    p_long double precision,
    p_radius_meters double precision DEFAULT 100.0,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    name text,
    address text,
    city_id uuid,
    neighborhood_id uuid,
    coordinates extensions.geography,
    google_place_id text,
    phone text,
    website text,
    is_verified boolean,
    is_closed boolean,
    closed_at timestamptz,
    types text[],
    created_at timestamptz,
    updated_at timestamptz,
    distance_meters double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_point extensions.geography;
BEGIN
    -- Build a geography point from lat/long (PostGIS uses long, lat order)
    v_user_point := extensions.ST_SetSRID(
        extensions.ST_MakePoint(p_long, p_lat),
        4326
    )::extensions.geography;

    RETURN QUERY
    SELECT
        r.id,
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
$$;
COMMENT ON FUNCTION public.find_nearby_restaurants IS 'Find restaurants within a radius (meters) of a lat/long point, ordered by distance';
