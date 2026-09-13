-- ============================================================
-- DRAFT 06 — Egress: bound the discover RPCs
--
-- Apply after draft_05. The old functions returned EVERY qualifying
-- restaurant in the city (with photo URLs) while the mobile client keeps
-- only the best row per dish type — the single largest egress source.
--
-- New parameters (signature change → DROP + CREATE):
--   p_per_dish_limit  rows kept per dish type (default 1 = client behavior)
--   p_limit           overall cap (default 100)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_discover_heroes(uuid, double precision, double precision, integer, integer);

CREATE FUNCTION public.get_discover_heroes(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_ratings integer DEFAULT 2, p_per_dish_limit integer DEFAULT 1, p_limit integer DEFAULT 100)
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
SELECT ranked.id,
    ranked.restaurant_id,
    ranked.restaurant_name,
    ranked.dish_type_id,
    ranked.city_id,
    ranked.neighborhood_id,
    ranked.neighborhood_name,
    ranked.bayesian_score,
    ranked.raw_weighted_avg,
    ranked.total_ratings,
    ranked.confidence_tier,
    ranked.featured_photo_url
FROM (
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
        gds.featured_photo_url,
        ROW_NUMBER() OVER (
            PARTITION BY gds.dish_type_id
            ORDER BY gds.bayesian_score DESC NULLS LAST
        ) AS rn
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
) ranked
WHERE ranked.rn <= p_per_dish_limit
ORDER BY ranked.bayesian_score DESC NULLS LAST
LIMIT p_limit;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_discover_rising_stars(uuid, double precision, double precision, integer, numeric, integer, integer);

CREATE FUNCTION public.get_discover_rising_stars(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_score numeric DEFAULT 7.5, p_max_ratings integer DEFAULT 10, p_min_ratings integer DEFAULT 2, p_per_dish_limit integer DEFAULT 1, p_limit integer DEFAULT 100)
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
SELECT ranked.id,
    ranked.restaurant_id,
    ranked.restaurant_name,
    ranked.dish_type_id,
    ranked.dish_type_name,
    ranked.dish_type_emoji,
    ranked.dish_type_icon,
    ranked.city_id,
    ranked.neighborhood_id,
    ranked.neighborhood_name,
    ranked.bayesian_score,
    ranked.raw_weighted_avg,
    ranked.total_ratings,
    ranked.confidence_tier,
    ranked.featured_photo_url
FROM (
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
        gds.featured_photo_url,
        ROW_NUMBER() OVER (
            PARTITION BY gds.dish_type_id
            ORDER BY gds.bayesian_score DESC NULLS LAST
        ) AS rn
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
) ranked
WHERE ranked.rn <= p_per_dish_limit
ORDER BY ranked.bayesian_score DESC NULLS LAST
LIMIT p_limit;
END;
$function$;
