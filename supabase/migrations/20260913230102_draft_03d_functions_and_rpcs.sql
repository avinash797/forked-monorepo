-- ---------- submit_comparison ----------
CREATE OR REPLACE FUNCTION public.submit_comparison(p_battle_id uuid, p_result text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_session RECORD;
    v_new_rating RECORD;
    v_opponent_id UUID;
    v_opponent_rating RECORD;
    v_k_max NUMERIC;
    v_k_decay NUMERIC;
    v_elo_min NUMERIC;
    v_elo_max NUMERIC;
    v_k_new NUMERIC;
    v_k_opp NUMERIC;
    v_expected_new NUMERIC;
    v_expected_opp NUMERIC;
    v_new_elo_before NUMERIC;
    v_opp_elo_before NUMERIC;
    v_new_elo_after NUMERIC;
    v_opp_elo_after NUMERIC;
    v_score_new NUMERIC;
    v_score_opp NUMERIC;
    v_mid_idx INTEGER;
    v_next_opponent JSONB := NULL;
    v_battle_complete BOOLEAN := false;
    v_next_opp_record RECORD;
    v_new_clamp_min NUMERIC;
    v_new_clamp_max NUMERIC;
    v_opp_clamp_min NUMERIC;
    v_opp_clamp_max NUMERIC;
    v_opp_rest_id UUID;
    v_new_badges JSONB := '[]'::JSONB;
BEGIN
-- 1. Load battle session
SELECT * INTO v_session
FROM battle_sessions
WHERE id = p_battle_id AND user_id = v_user_id AND status = 'active';
IF v_session IS NULL THEN RAISE EXCEPTION 'No active battle session found'; END IF;
-- 2. Load new rating and current opponent
SELECT id, elo_score, comparison_count, sentiment INTO v_new_rating
FROM personal_ratings WHERE id = v_session.rating_id;

v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
v_opponent_id := v_session.candidate_ids[v_mid_idx + 1];

SELECT id, elo_score, comparison_count, sentiment INTO v_opponent_rating
FROM personal_ratings WHERE id = v_opponent_id;
-- 3. Load constants
SELECT value INTO v_k_max   FROM app_constants WHERE key = 'K_MAX';
SELECT value INTO v_k_decay FROM app_constants WHERE key = 'K_DECAY';
SELECT value INTO v_elo_min FROM app_constants WHERE key = 'ELO_MIN';
SELECT value INTO v_elo_max FROM app_constants WHERE key = 'ELO_MAX';

v_new_elo_before := v_new_rating.elo_score;
v_opp_elo_before := v_opponent_rating.elo_score;
-- 4. Apply Elo update
IF p_result IN ('new_wins', 'opponent_wins') THEN
    v_k_new := v_k_max / (1 + v_k_decay * v_new_rating.comparison_count);
    v_k_opp := v_k_max / (1 + v_k_decay * v_opponent_rating.comparison_count);
    v_expected_new := 1.0 / (1.0 + power(10.0, (v_opp_elo_before - v_new_elo_before) / 400.0));
    v_expected_opp := 1.0 - v_expected_new;
    IF p_result = 'new_wins' THEN v_score_new := 1.0; v_score_opp := 0.0;
    ELSE v_score_new := 0.0; v_score_opp := 1.0; END IF;
    SELECT value INTO v_new_clamp_min FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MIN';
    SELECT value INTO v_new_clamp_max FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MAX';
    SELECT value INTO v_opp_clamp_min FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MIN';
    SELECT value INTO v_opp_clamp_max FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MAX';
    v_new_elo_after := LEAST(GREATEST(v_new_elo_before + v_k_new * (v_score_new - v_expected_new), v_new_clamp_min), v_new_clamp_max);
    v_opp_elo_after := LEAST(GREATEST(v_opp_elo_before + v_k_opp * (v_score_opp - v_expected_opp), v_opp_clamp_min), v_opp_clamp_max);
    UPDATE personal_ratings SET elo_score = v_new_elo_after, comparison_count = comparison_count + 1 WHERE id = v_new_rating.id;
    UPDATE personal_ratings SET elo_score = v_opp_elo_after, comparison_count = comparison_count + 1 WHERE id = v_opponent_rating.id;
ELSE
    v_new_elo_after := v_new_elo_before;
    v_opp_elo_after := v_opp_elo_before;
    v_k_new := 0; v_k_opp := 0;
END IF;
-- 5. Record comparison
INSERT INTO comparisons (
        user_id, dish_type_id, new_rating_id, opponent_rating_id,
        result, step_number,
        new_elo_before, new_elo_after,
        opponent_elo_before, opponent_elo_after,
        k_factor_new, k_factor_opponent
    )
VALUES (
        v_user_id, v_session.dish_type_id, v_new_rating.id, v_opponent_id,
        p_result, v_session.current_step,
        v_new_elo_before, v_new_elo_after,
        v_opp_elo_before, v_opp_elo_after,
        v_k_new, v_k_opp
    );
-- 6. Advance binary search or complete
IF p_result = 'skipped' THEN
    v_battle_complete := true;
ELSIF p_result = 'new_wins' THEN
    UPDATE battle_sessions SET high_idx = v_mid_idx - 1, current_step = current_step + 1, updated_at = now() WHERE id = p_battle_id;
    SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
ELSE
    UPDATE battle_sessions SET low_idx = v_mid_idx + 1, current_step = current_step + 1, updated_at = now() WHERE id = p_battle_id;
    SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
END IF;
IF v_session.low_idx > v_session.high_idx THEN v_battle_complete := true; END IF;
-- 7. Finalize or return next opponent
IF v_battle_complete THEN
    UPDATE battle_sessions SET status = 'completed', updated_at = now() WHERE id = p_battle_id;
    UPDATE personal_ratings SET battle_status = 'completed' WHERE id = v_new_rating.id;
    PERFORM _update_profile_stats(v_user_id);
    PERFORM _update_global_dish_score(
        (SELECT restaurant_id FROM personal_ratings WHERE id = v_new_rating.id),
        v_session.dish_type_id
    );
    FOR v_opp_rest_id IN
        SELECT DISTINCT pr.restaurant_id
        FROM comparisons c
            JOIN personal_ratings pr ON pr.id = c.opponent_rating_id
        WHERE c.new_rating_id = v_new_rating.id
            AND c.result != 'skipped'
            AND pr.restaurant_id != (SELECT restaurant_id FROM personal_ratings WHERE id = v_new_rating.id)
    LOOP
        PERFORM _update_global_dish_score(v_opp_rest_id, v_session.dish_type_id);
    END LOOP;
    v_new_badges := public.evaluate_badges(v_user_id);
    RETURN jsonb_build_object(
        'battle_complete', true,
        'rating_id', v_new_rating.id,
        'final_elo', v_new_elo_after,
        'final_derived_score', ROUND(((LEAST(GREATEST(v_new_elo_after, v_elo_min), v_elo_max) - 1000) / 1000.0) * 10.0, 1),
        'comparisons_made', v_session.current_step,
        'new_badges', v_new_badges
    );
ELSE
    -- Resolve placeholder at read time
    v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
    v_opponent_id := v_session.candidate_ids[v_mid_idx + 1];
    SELECT pr.id,
        pr.restaurant_id,
        pr.elo_score,
        COALESCE(pr.photo_url, dt.placeholder_photo_url) AS photo_url,
        ROUND(((LEAST(GREATEST(pr.elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score,
        r.name AS restaurant_name
        INTO v_next_opp_record
    FROM personal_ratings pr
        JOIN restaurants r ON r.id = pr.restaurant_id
        JOIN dish_types dt ON dt.id = pr.dish_type_id
    WHERE pr.id = v_opponent_id;
    RETURN jsonb_build_object(
        'battle_complete', false,
        'rating_id', v_new_rating.id,
        'current_elo', v_new_elo_after,
        'opponent', jsonb_build_object(
            'rating_id', v_next_opp_record.id,
            'restaurant_id', v_next_opp_record.restaurant_id,
            'restaurant_name', v_next_opp_record.restaurant_name,
            'elo_score', v_next_opp_record.elo_score,
            'derived_score', v_next_opp_record.display_score,
            'photo_url', v_next_opp_record.photo_url
        ),
        'opponent_index', v_mid_idx,
        'step', v_session.current_step,
        'remaining_range', v_session.high_idx - v_session.low_idx + 1
    );
END IF;
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
    v_inserted INTEGER := 0;
    v_batch    INTEGER;
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
    WHERE gds.total_ratings >= 2
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
    WHERE gds.total_ratings >= 2
      AND gds.neighborhood_id IS NOT NULL
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    RETURN v_inserted;
END;
$function$;

-- ---------- upsert_restaurant_from_google ----------
CREATE OR REPLACE FUNCTION public.upsert_restaurant_from_google(p_google_place_id text, p_name text, p_address text, p_city_name text, p_state text, p_country text, p_neighborhood_name text DEFAULT NULL::text, p_lat double precision DEFAULT NULL::double precision, p_lng double precision DEFAULT NULL::double precision, p_phone text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_types text[] DEFAULT NULL::text[], p_location_properties jsonb DEFAULT NULL::jsonb)
 RETURNS SETOF restaurants
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_city_id UUID;
    v_neighborhood_id UUID;
    v_city_slug TEXT;
    v_coordinates extensions.geography(Point, 4326);
    v_city_record public.cities%ROWTYPE;
    v_point extensions.geometry;
BEGIN
    -- Early return: if restaurant already exists, skip all resolution work
    IF p_google_place_id IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM public.restaurants
        WHERE google_place_id = p_google_place_id;

        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    -- Resolve city
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
        v_city_slug := public.slugify(p_city_name || '-' || COALESCE(p_state, ''));
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

            IF v_neighborhood_id IS NULL THEN
                SELECT id INTO v_neighborhood_id
                FROM public.neighborhoods
                WHERE lower(name) = lower(p_neighborhood_name)
                    AND city_id = v_city_id;
            END IF;
        END IF;
    END IF;

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
            location_properties,
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
            p_location_properties,
            now()
        ) ON CONFLICT (google_place_id) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        city_id = COALESCE(public.restaurants.city_id, EXCLUDED.city_id),
        neighborhood_id = COALESCE(EXCLUDED.neighborhood_id, public.restaurants.neighborhood_id),
        coordinates = EXCLUDED.coordinates,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        types = EXCLUDED.types,
        location_properties = COALESCE(EXCLUDED.location_properties, public.restaurants.location_properties),
        updated_at = now()
    RETURNING *;
END;
$function$;


-- =============================================================================
-- FIX (function_search_path_mutable): pin search_path, including `extensions`.
-- =============================================================================
ALTER FUNCTION public.check_city_is_new(uuid)                 SET search_path = public, extensions;
ALTER FUNCTION public.get_dish_type_entry_counts(uuid)       SET search_path = public, extensions;
ALTER FUNCTION public.match_location(double precision, double precision) SET search_path = public, extensions;
ALTER FUNCTION public.slugify(text)                          SET search_path = public, extensions;
ALTER FUNCTION public.search_restaurants(text)              SET search_path = public, extensions;
ALTER FUNCTION public.search_dish_types(text)               SET search_path = public, extensions;
ALTER FUNCTION public.search_restaurant_dishes(text)        SET search_path = public, extensions;
ALTER FUNCTION public.upsert_restaurant_from_google(
    text, text, text, text, text, text, text,
    double precision, double precision, text, text, text[], jsonb
) SET search_path = public, extensions;

-- =============================================================================
-- FIX (security_definer_function_executable): internal-only functions.
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public._update_global_dish_score(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._update_profile_stats(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.evaluate_badges(uuid)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.take_leaderboard_snapshot(date)       FROM PUBLIC, anon, authenticated;
-- award_badge_manual keeps its grant: gated by an internal is_admin() check.
