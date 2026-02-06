-- Lightweight RPC to check if a city was just created (inactive) and needs enrichment.
-- Called by the client after upsert_restaurant_from_google to decide whether to show
-- the city onboarding screen.
CREATE OR REPLACE FUNCTION public.check_city_is_new(p_city_id uuid)
RETURNS TABLE(is_new boolean, city_name text, city_state text, city_country text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        NOT c.is_active AS is_new,
        c.name AS city_name,
        c.state AS city_state,
        COALESCE(c.country, 'USA') AS city_country
    FROM public.cities c
    WHERE c.id = p_city_id;
$$;

COMMENT ON FUNCTION public.check_city_is_new(uuid) IS 'Checks if a city is inactive (newly created) and returns city details for client-side enrichment flow';
