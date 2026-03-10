-- ============================================================
-- FIX: upsert_restaurant_from_google — auto-create neighborhoods
-- Neighborhoods were never being populated because the function
-- only matched existing rows but never created them, even when
-- Google provides a neighborhood name. This mirrors how the same
-- function already auto-creates cities.
-- Also fixes ON CONFLICT to always prefer a freshly resolved
-- neighborhood_id over a potentially stale NULL on the existing row.
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_restaurant_from_google(
        p_google_place_id TEXT,
        p_name TEXT,
        p_address TEXT,
        p_city_name TEXT,
        p_state TEXT,
        p_country TEXT,
        p_neighborhood_name TEXT DEFAULT NULL,
        p_lat FLOAT8 DEFAULT NULL,
        p_lng FLOAT8 DEFAULT NULL,
        p_phone TEXT DEFAULT NULL,
        p_website TEXT DEFAULT NULL,
        p_types TEXT [] DEFAULT NULL
    ) RETURNS SETOF public.restaurants LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_city_id UUID;
v_neighborhood_id UUID;
v_city_slug TEXT;
v_coordinates extensions.geography(Point, 4326);
v_city_record public.cities %ROWTYPE;
v_point extensions.geometry;
BEGIN -- Resolve city
SELECT * INTO v_city_record
FROM public.cities
WHERE lower(name) = lower(p_city_name)
    AND (
        p_state IS NULL
        OR lower(state) = lower(p_state)
    )
LIMIT 1;
IF v_city_record.id IS NOT NULL THEN v_city_id := v_city_record.id;
ELSE v_city_slug := public.slugify(p_city_name || '-' || COALESCE(p_state, ''));
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
    ) ON CONFLICT (slug) DO NOTHING
RETURNING id INTO v_city_id;
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
-- Resolve neighborhood
-- Strategy 1: spatial containment (requires boundary polygons to be seeded)
-- Strategy 2: name match against existing rows
-- Strategy 3: auto-create from Google-provided name (same pattern as city auto-create)
IF v_city_id IS NOT NULL THEN
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_point := st_setsrid(st_point(p_lng, p_lat), 4326);
        SELECT id INTO v_neighborhood_id
        FROM public.neighborhoods
        WHERE city_id = v_city_id
            AND boundary IS NOT NULL
            AND st_contains(boundary::extensions.geometry, v_point)
        LIMIT 1;
    END IF;
    -- Name match if spatial failed or lat/lng not available
    IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
        SELECT id INTO v_neighborhood_id
        FROM public.neighborhoods
        WHERE lower(name) = lower(p_neighborhood_name)
            AND city_id = v_city_id;
    END IF;
    -- Auto-create if name provided but no match found
    IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
        INSERT INTO public.neighborhoods (city_id, name, slug)
        VALUES (v_city_id, p_neighborhood_name, public.slugify(p_neighborhood_name))
        ON CONFLICT (city_id, slug) DO NOTHING
        RETURNING id INTO v_neighborhood_id;
        -- ON CONFLICT means row exists; fetch it
        IF v_neighborhood_id IS NULL THEN
            SELECT id INTO v_neighborhood_id
            FROM public.neighborhoods
            WHERE lower(name) = lower(p_neighborhood_name)
                AND city_id = v_city_id;
        END IF;
    END IF;
END IF;
IF p_lat IS NOT NULL
AND p_lng IS NOT NULL THEN v_coordinates := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
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
    ) ON CONFLICT (google_place_id) DO
UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    city_id = COALESCE(public.restaurants.city_id, EXCLUDED.city_id),
    neighborhood_id = COALESCE(EXCLUDED.neighborhood_id, public.restaurants.neighborhood_id),
    coordinates = EXCLUDED.coordinates,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    types = EXCLUDED.types,
    updated_at = now()
RETURNING *;
END;
$$;
