-- Create a slugify utility function
CREATE OR REPLACE FUNCTION public.slugify(v_text text) RETURNS text AS $$ BEGIN RETURN lower(
        regexp_replace(
            regexp_replace(
                v_text,
                '[^a-zA-Z0-9\s-]',
                '',
                'g' -- Remove non-alphanumeric except space and hyphen
            ),
            '\s+',
            '-',
            'g' -- Replace spaces with hyphens
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- Create the upsert RPC function
CREATE OR REPLACE FUNCTION public.upsert_restaurant_from_google(
        p_google_place_id text,
        p_name text,
        p_address text,
        p_city_name text,
        p_state text,
        p_country text,
        p_neighborhood_name text DEFAULT NULL,
        p_lat float8 DEFAULT NULL,
        p_lng float8 DEFAULT NULL,
        p_phone text DEFAULT NULL,
        p_website text DEFAULT NULL,
        p_types text [] DEFAULT NULL
    ) RETURNS SETOF public.restaurants AS $$
DECLARE
    v_city_id uuid;
    v_neighborhood_id uuid;
    v_city_slug text;
    v_coordinates geography(Point, 4326);
    v_city_record public.cities %ROWTYPE;
    v_point extensions.geometry;
BEGIN
    -- 1. Resolve City
    -- Try to find existing city by name + state (case insensitive)
    SELECT * INTO v_city_record
    FROM public.cities
    WHERE lower(name) = lower(p_city_name)
        AND (
            p_state IS NULL
            OR lower(state) = lower(p_state)
        )
    LIMIT 1;

    IF v_city_record.id IS NOT NULL THEN
        v_city_id := v_city_record.id;
    ELSE
        -- Generate slug from name + state to avoid collisions (e.g. portland-or vs portland-me)
        v_city_slug := public.slugify(p_city_name || '-' || COALESCE(p_state, ''));

        -- Insert new city (inactive — admin must activate for leaderboards/location matching)
        INSERT INTO public.cities (
                name,
                state,
                country,
                slug,
                is_active,
                coordinates
            )
        VALUES (
                p_city_name,
                p_state,
                p_country,
                v_city_slug,
                false,
                CASE
                    WHEN p_lat IS NOT NULL
                    AND p_lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
                    ELSE NULL
                END
            )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id INTO v_city_id;

        -- If slug conflict (race condition or existing slug), fetch by name+state
        IF v_city_id IS NULL THEN
            SELECT id INTO v_city_id
            FROM public.cities
            WHERE lower(name) = lower(p_city_name)
                AND (
                    p_state IS NULL
                    OR lower(state) = lower(p_state)
                );
        END IF;
    END IF;

    -- 2. Resolve Neighborhood (match only, never auto-create)
    -- Neighborhoods require admin-seeded PostGIS polygon boundaries for spatial queries.
    -- Auto-creating from Google data would produce neighborhoods with NULL boundaries,
    -- breaking match_location() and leaderboard neighborhood filtering.
    IF v_city_id IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        -- Prefer PostGIS containment matching (most accurate)
        v_point := st_setsrid(st_point(p_lng, p_lat), 4326);

        SELECT id INTO v_neighborhood_id
        FROM public.neighborhoods
        WHERE city_id = v_city_id
            AND st_contains(boundary::extensions.geometry, v_point)
        LIMIT 1;

        -- Fallback: try name matching if PostGIS didn't find a match and we have a name
        IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
            SELECT id INTO v_neighborhood_id
            FROM public.neighborhoods
            WHERE lower(name) = lower(p_neighborhood_name)
                AND city_id = v_city_id;
        END IF;
    ELSIF v_city_id IS NOT NULL AND p_neighborhood_name IS NOT NULL THEN
        -- No coordinates available, try name matching only
        SELECT id INTO v_neighborhood_id
        FROM public.neighborhoods
        WHERE lower(name) = lower(p_neighborhood_name)
            AND city_id = v_city_id;
    END IF;

    -- 3. Upsert Restaurant
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_coordinates := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    INSERT INTO public.restaurants (
            google_place_id,
            name,
            address,
            city_id,
            neighborhood_id,
            coordinates,
            phone,
            website,
            types,
            updated_at
        )
    VALUES (
            p_google_place_id,
            p_name,
            p_address,
            v_city_id,
            v_neighborhood_id,
            v_coordinates,
            p_phone,
            p_website,
            p_types,
            now()
        )
    ON CONFLICT (google_place_id) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        city_id = COALESCE(public.restaurants.city_id, EXCLUDED.city_id),
        neighborhood_id = COALESCE(public.restaurants.neighborhood_id, EXCLUDED.neighborhood_id),
        coordinates = EXCLUDED.coordinates,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        types = EXCLUDED.types,
        updated_at = now()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
