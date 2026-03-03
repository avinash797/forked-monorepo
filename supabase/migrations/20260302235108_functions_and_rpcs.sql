-- =============================================================================
-- DRAFT MIGRATION 3: Functions and RPCs
--
-- Dependency order (bottom-up):
--   Utility helpers (slugify, check_user_skip_rate,
--                    check_rate_limit, close_restaurant, anonymize_user_data,
--                    delete_user_account)
--   recalculate_derived_scores  ← internal ranking helper
--   compute_community_score     ← Bayesian leaderboard helper
--   create_rating               ← main entry point
--   process_battle / skip_battle
--   get_leaderboard / get_nearby_leaderboard
--   get_my_best_ever / get_my_dish_rankings / get_user_stats
--   get_discover_heroes / get_discover_rising_stars
--   Location: match_location, check_city_is_new
--   Restaurant: find_nearby_restaurants, upsert_restaurant_from_google
--   Search: search_restaurants, search_dish_types, search_restaurant_dishes
--   Admin: get_admin_*, get_personal_dish_type_counts, recalculate_global_scores
--
-- Run order: 3 of 4 (after draft_02_rls_and_indexes.sql)
-- =============================================================================

-- ============================================================
-- UTILITY: slugify
-- ============================================================
CREATE OR REPLACE FUNCTION public.slugify(v_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(v_text, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$;

-- ============================================================
-- UTILITY: check_user_skip_rate
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_user_skip_rate(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_comparisons BIGINT,
    skipped_count BIGINT,
    skip_rate DECIMAL,
    should_warn BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_total BIGINT;
    v_skipped BIGINT;
    v_rate DECIMAL;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE result = 'skipped')
    INTO v_total, v_skipped
    FROM public.comparisons
    WHERE user_id = v_user_id
      AND created_at > now() - INTERVAL '30 days';

    v_rate := CASE WHEN v_total > 0 THEN v_skipped::DECIMAL / v_total ELSE 0 END;

    RETURN QUERY SELECT v_total, v_skipped, ROUND(v_rate, 3), (v_rate > 0.5 AND v_total >= 10);
END;
$$;

-- ============================================================
-- UTILITY: check_rate_limit
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    is_rate_limited BOOLEAN,
    ratings_last_hour INTEGER,
    max_allowed INTEGER,
    can_rate BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER;
    v_max INTEGER := 20;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.personal_ratings
    WHERE user_id = v_user_id AND created_at > now() - INTERVAL '1 hour';

    RETURN QUERY SELECT (v_count >= v_max), v_count, v_max, (v_count < v_max);
END;
$$;

-- ============================================================
-- UTILITY: close_restaurant (soft delete)
-- ============================================================
CREATE OR REPLACE FUNCTION public.close_restaurant(
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_restaurant_name TEXT;
BEGIN
    UPDATE public.restaurants
    SET is_closed = TRUE, closed_at = now(), updated_at = now()
    WHERE id = p_restaurant_id
    RETURNING name INTO v_restaurant_name;

    IF NOT FOUND THEN RAISE EXCEPTION 'Restaurant not found'; END IF;

    RETURN jsonb_build_object(
        'success', true,
        'restaurant_id', p_restaurant_id,
        'restaurant_name', v_restaurant_name,
        'closed_at', now()
    );
END;
$$;

-- ============================================================
-- UTILITY: anonymize_user_data (GDPR)
-- ============================================================
CREATE OR REPLACE FUNCTION public.anonymize_user_data(
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_ratings_count INTEGER;
    v_comparisons_count INTEGER;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;
    IF v_user_id != auth.uid() THEN RAISE EXCEPTION 'Can only anonymize your own data'; END IF;

    SELECT COUNT(*) INTO v_ratings_count FROM public.personal_ratings WHERE user_id = v_user_id;
    SELECT COUNT(*) INTO v_comparisons_count FROM public.comparisons WHERE user_id = v_user_id;

    UPDATE public.profiles
    SET username = 'deleted_' || SUBSTRING(id::TEXT, 1, 8),
        display_name = 'Deleted User',
        avatar_url = NULL, bio = NULL,
        expo_push_token = NULL, push_enabled = FALSE,
        updated_at = now()
    WHERE id = v_user_id;

    UPDATE public.personal_ratings SET notes = NULL, updated_at = now() WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'ratings_anonymized', v_ratings_count,
        'comparisons_preserved', v_comparisons_count,
        'note', 'Ratings preserved for leaderboard integrity. Personal data removed.'
    );
END;
$$;

-- ============================================================
-- UTILITY: delete_user_account
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_account(
    p_confirm BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_ratings_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT p_confirm THEN RAISE EXCEPTION 'Must confirm deletion by passing p_confirm = true'; END IF;

    SELECT COUNT(*) INTO v_ratings_count FROM public.personal_ratings WHERE user_id = v_user_id;

    DELETE FROM public.personal_ratings WHERE user_id = v_user_id;
    DELETE FROM public.comparisons WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'ratings_deleted', v_ratings_count,
        'note', 'Profile and ratings deleted. Auth account must be deleted separately.'
    );
END;
$$;

-- ============================================================
-- CORE: create_rating
-- Creates the rating record, sets up the battle session, and returns the first opponent.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_rating(
    p_restaurant_id       UUID,
    p_dish_type_id        UUID,
    p_sentiment           TEXT,
    p_photo_url           TEXT,
    p_photo_storage_path  TEXT    DEFAULT NULL,
    p_variation_id        UUID    DEFAULT NULL,
    p_notes               TEXT    DEFAULT NULL,
    p_taste_tag_ids       UUID[]  DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id         UUID := auth.uid();
    v_rating_id       UUID;
    v_initial_elo     NUMERIC;
    v_zone_min        NUMERIC;
    v_zone_max        NUMERIC;
    v_is_re_rating    BOOLEAN := false;
    v_candidates      UUID[];
    v_candidate_count INTEGER;
    v_battle_id       UUID;
    v_first_opponent  JSONB := NULL;
    v_mid_idx         INTEGER;
    v_opponent_rating RECORD;
BEGIN
    -- -------------------------------------------------------
    -- 1. Resolve initial Elo from sentiment
    -- -------------------------------------------------------
    SELECT value INTO v_initial_elo FROM app_constants
        WHERE key = 'ELO_INITIAL_' || UPPER(
            CASE p_sentiment
                WHEN 'liked' THEN 'LIKED'
                WHEN 'okay' THEN 'OKAY'
                WHEN 'disliked' THEN 'DISLIKED'
            END
        );

    IF v_initial_elo IS NULL THEN
        RAISE EXCEPTION 'Invalid sentiment: %', p_sentiment;
    END IF;

    -- -------------------------------------------------------
    -- 2. Resolve search zone boundaries
    -- -------------------------------------------------------
    CASE p_sentiment
        WHEN 'liked' THEN
            SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ZONE_LIKED_MIN';
            SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ELO_MAX';
        WHEN 'okay' THEN
            SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ZONE_OKAY_MIN';
            SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ZONE_OKAY_MAX';
        WHEN 'disliked' THEN
            SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ELO_MIN';
            SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ZONE_DISLIKED_MAX';
    END CASE;

    -- -------------------------------------------------------
    -- 3. Upsert the personal rating
    -- -------------------------------------------------------
    SELECT id INTO v_rating_id
        FROM personal_ratings
        WHERE user_id = v_user_id
          AND restaurant_id = p_restaurant_id
          AND dish_type_id = p_dish_type_id;

    IF v_rating_id IS NOT NULL THEN
        -- Re-rating: reset Elo and comparison count
        v_is_re_rating := true;

        -- Abandon any active battle for this rating
        UPDATE battle_sessions
            SET status = 'abandoned', updated_at = now()
            WHERE rating_id = v_rating_id AND status = 'active';

        UPDATE personal_ratings SET
            sentiment = p_sentiment,
            elo_score = v_initial_elo,
            comparison_count = 0,
            battle_status = 'pending',
            photo_url = p_photo_url,
            photo_storage_path = COALESCE(p_photo_storage_path, photo_storage_path),
            variation_id = p_variation_id,
            notes = p_notes,
            updated_at = now()
        WHERE id = v_rating_id;

        -- Replace tags
        DELETE FROM personal_rating_tags WHERE rating_id = v_rating_id;
    ELSE
        INSERT INTO personal_ratings (
            user_id, restaurant_id, dish_type_id,
            sentiment, elo_score, comparison_count, battle_status,
            photo_url, photo_storage_path, variation_id, notes
        ) VALUES (
            v_user_id, p_restaurant_id, p_dish_type_id,
            p_sentiment, v_initial_elo, 0, 'pending',
            p_photo_url, p_photo_storage_path, p_variation_id, p_notes
        )
        RETURNING id INTO v_rating_id;
    END IF;

    -- -------------------------------------------------------
    -- 4. Insert taste tags
    -- -------------------------------------------------------
    IF p_taste_tag_ids IS NOT NULL AND array_length(p_taste_tag_ids, 1) > 0 THEN
        INSERT INTO personal_rating_tags (rating_id, tag_id)
        SELECT v_rating_id, unnest(p_taste_tag_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    -- -------------------------------------------------------
    -- 5. Build candidate list for binary search
    --    (other ratings in same dish type within the Elo zone)
    -- -------------------------------------------------------
    SELECT ARRAY_AGG(id ORDER BY elo_score DESC)
    INTO v_candidates
    FROM personal_ratings
    WHERE user_id = v_user_id
      AND dish_type_id = p_dish_type_id
      AND id != v_rating_id
      AND battle_status = 'completed'
      AND elo_score >= v_zone_min
      AND elo_score <= v_zone_max;

    v_candidates := COALESCE(v_candidates, '{}');
    v_candidate_count := COALESCE(array_length(v_candidates, 1), 0);

    -- -------------------------------------------------------
    -- 6. If no candidates, battle is instantly complete
    -- -------------------------------------------------------
    IF v_candidate_count = 0 THEN
        UPDATE personal_ratings
            SET battle_status = 'completed'
            WHERE id = v_rating_id;

        -- Update profile stats
        PERFORM _update_profile_stats(v_user_id);
        -- Update leaderboard
        PERFORM _update_global_dish_score(p_restaurant_id, p_dish_type_id);

        RETURN jsonb_build_object(
            'rating_id', v_rating_id,
            'battle_id', NULL,
            'opponent', NULL,
            'battle_complete', true,
            'is_re_rating', v_is_re_rating,
            'elo_score', v_initial_elo,
            'derived_score', ROUND(((v_initial_elo - 1000) / 1000.0) * 10.0, 1)
        );
    END IF;

    -- -------------------------------------------------------
    -- 7. Create battle session
    -- -------------------------------------------------------
    UPDATE personal_ratings
        SET battle_status = 'in_progress'
        WHERE id = v_rating_id;

    INSERT INTO battle_sessions (
        user_id, rating_id, dish_type_id,
        candidate_ids, low_idx, high_idx, current_step
    ) VALUES (
        v_user_id, v_rating_id, p_dish_type_id,
        v_candidates, 0, v_candidate_count - 1, 1
    )
    RETURNING id INTO v_battle_id;

    -- -------------------------------------------------------
    -- 8. Return first opponent (midpoint)
    -- -------------------------------------------------------
    v_mid_idx := (0 + (v_candidate_count - 1)) / 2;

    SELECT id, restaurant_id, elo_score,
           ROUND(((LEAST(GREATEST(elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score
    INTO v_opponent_rating
    FROM personal_ratings
    WHERE id = v_candidates[v_mid_idx + 1]; -- 1-indexed array access

    SELECT jsonb_build_object(
        'rating_id', v_opponent_rating.id,
        'restaurant_id', v_opponent_rating.restaurant_id,
        'restaurant_name', r.name,
        'elo_score', v_opponent_rating.elo_score,
        'derived_score', v_opponent_rating.display_score,
        'photo_url', pr.photo_url
    ) INTO v_first_opponent
    FROM restaurants r
    JOIN personal_ratings pr ON pr.id = v_opponent_rating.id
    WHERE r.id = v_opponent_rating.restaurant_id;

    RETURN jsonb_build_object(
        'rating_id', v_rating_id,
        'battle_id', v_battle_id,
        'opponent', v_first_opponent,
        'opponent_index', v_mid_idx,
        'battle_complete', false,
        'is_re_rating', v_is_re_rating,
        'total_candidates', v_candidate_count,
        'elo_score', v_initial_elo
    );
END;
$$;

-- ============================================================
-- CORE: submit_comparison 
-- Process One Battle Step.
-- Applies Elo update, records the comparison, advances binary search, returns next opponent or signals completion.
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_comparison(
    p_battle_id    UUID,
    p_result       TEXT   -- 'new_wins', 'opponent_wins', 'skipped'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id           UUID := auth.uid();
    v_session           RECORD;
    v_new_rating        RECORD;
    v_opponent_id       UUID;
    v_opponent_rating   RECORD;
    -- Elo calculation vars
    v_k_max             NUMERIC;
    v_k_decay           NUMERIC;
    v_elo_min           NUMERIC;
    v_elo_max           NUMERIC;
    v_k_new             NUMERIC;
    v_k_opp             NUMERIC;
    v_expected_new      NUMERIC;
    v_expected_opp      NUMERIC;
    v_new_elo_before    NUMERIC;
    v_opp_elo_before    NUMERIC;
    v_new_elo_after     NUMERIC;
    v_opp_elo_after     NUMERIC;
    v_score_new         NUMERIC;
    v_score_opp         NUMERIC;
    -- Binary search vars
    v_mid_idx           INTEGER;
    v_next_opponent     JSONB := NULL;
    v_battle_complete   BOOLEAN := false;
    v_next_opp_record   RECORD;
BEGIN
    -- -------------------------------------------------------
    -- 1. Load battle session (verify ownership)
    -- -------------------------------------------------------
    SELECT * INTO v_session
    FROM battle_sessions
    WHERE id = p_battle_id
      AND user_id = v_user_id
      AND status = 'active';

    IF v_session IS NULL THEN
        RAISE EXCEPTION 'No active battle session found';
    END IF;

    -- -------------------------------------------------------
    -- 2. Load the new rating and current opponent
    -- -------------------------------------------------------
    SELECT id, elo_score, comparison_count
    INTO v_new_rating
    FROM personal_ratings WHERE id = v_session.rating_id;

    v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
    v_opponent_id := v_session.candidate_ids[v_mid_idx + 1]; -- 1-indexed

    SELECT id, elo_score, comparison_count
    INTO v_opponent_rating
    FROM personal_ratings WHERE id = v_opponent_id;

    -- -------------------------------------------------------
    -- 3. Load constants
    -- -------------------------------------------------------
    SELECT value INTO v_k_max FROM app_constants WHERE key = 'K_MAX';
    SELECT value INTO v_k_decay FROM app_constants WHERE key = 'K_DECAY';
    SELECT value INTO v_elo_min FROM app_constants WHERE key = 'ELO_MIN';
    SELECT value INTO v_elo_max FROM app_constants WHERE key = 'ELO_MAX';

    -- Snapshot before
    v_new_elo_before := v_new_rating.elo_score;
    v_opp_elo_before := v_opponent_rating.elo_score;

    -- -------------------------------------------------------
    -- 4. Apply Elo update (skip if 'skipped')
    -- -------------------------------------------------------
    IF p_result IN ('new_wins', 'opponent_wins') THEN
        -- Dynamic K-factors
        v_k_new := v_k_max / (1 + v_k_decay * v_new_rating.comparison_count);
        v_k_opp := v_k_max / (1 + v_k_decay * v_opponent_rating.comparison_count);

        -- Expected outcomes
        v_expected_new := 1.0 / (1.0 + power(10.0, (v_opp_elo_before - v_new_elo_before) / 400.0));
        v_expected_opp := 1.0 - v_expected_new;

        -- Actual scores
        IF p_result = 'new_wins' THEN
            v_score_new := 1.0;
            v_score_opp := 0.0;
        ELSE
            v_score_new := 0.0;
            v_score_opp := 1.0;
        END IF;

        -- Compute new Elo (clamped)
        v_new_elo_after := LEAST(GREATEST(
            v_new_elo_before + v_k_new * (v_score_new - v_expected_new),
            v_elo_min), v_elo_max);
        v_opp_elo_after := LEAST(GREATEST(
            v_opp_elo_before + v_k_opp * (v_score_opp - v_expected_opp),
            v_elo_min), v_elo_max);

        -- Update ratings
        UPDATE personal_ratings SET
            elo_score = v_new_elo_after,
            comparison_count = comparison_count + 1
        WHERE id = v_new_rating.id;

        UPDATE personal_ratings SET
            elo_score = v_opp_elo_after,
            comparison_count = comparison_count + 1
        WHERE id = v_opponent_rating.id;
    ELSE
        -- Skipped: no Elo change
        v_new_elo_after := v_new_elo_before;
        v_opp_elo_after := v_opp_elo_before;
        v_k_new := 0;
        v_k_opp := 0;
    END IF;

    -- -------------------------------------------------------
    -- 5. Record comparison
    -- -------------------------------------------------------
    INSERT INTO comparisons (
        user_id, dish_type_id,
        new_rating_id, opponent_rating_id,
        result, step_number,
        new_elo_before, new_elo_after,
        opponent_elo_before, opponent_elo_after,
        k_factor_new, k_factor_opponent
    ) VALUES (
        v_user_id, v_session.dish_type_id,
        v_new_rating.id, v_opponent_id,
        p_result, v_session.current_step,
        v_new_elo_before, v_new_elo_after,
        v_opp_elo_before, v_opp_elo_after,
        v_k_new, v_k_opp
    );

    -- -------------------------------------------------------
    -- 6. Advance binary search or complete
    -- -------------------------------------------------------
    IF p_result = 'skipped' THEN
        -- Skip ends the battle immediately
        v_battle_complete := true;
    ELSIF p_result = 'new_wins' THEN
        -- New dish is better → search upper half (lower indices = higher Elo)
        UPDATE battle_sessions SET
            high_idx = v_mid_idx - 1,
            current_step = current_step + 1,
            updated_at = now()
        WHERE id = p_battle_id;
        -- Refresh session
        SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
    ELSE
        -- Opponent wins → search lower half
        UPDATE battle_sessions SET
            low_idx = v_mid_idx + 1,
            current_step = current_step + 1,
            updated_at = now()
        WHERE id = p_battle_id;
        SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
    END IF;

    -- Check if search is exhausted
    IF v_session.low_idx > v_session.high_idx THEN
        v_battle_complete := true;
    END IF;

    -- -------------------------------------------------------
    -- 7. If complete: finalize. Otherwise: return next opponent.
    -- -------------------------------------------------------
    IF v_battle_complete THEN
        -- Mark battle and rating as completed
        UPDATE battle_sessions
            SET status = 'completed', updated_at = now()
            WHERE id = p_battle_id;

        UPDATE personal_ratings
            SET battle_status = 'completed'
            WHERE id = v_new_rating.id;

        -- Update profile stats (total_ratings, credibility)
        PERFORM _update_profile_stats(v_user_id);

        -- Update global leaderboard for the affected restaurant+dish
        PERFORM _update_global_dish_score(
            (SELECT restaurant_id FROM personal_ratings WHERE id = v_new_rating.id),
            v_session.dish_type_id
        );

        RETURN jsonb_build_object(
            'battle_complete', true,
            'rating_id', v_new_rating.id,
            'final_elo', v_new_elo_after,
            'final_derived_score', ROUND(((LEAST(GREATEST(v_new_elo_after, v_elo_min), v_elo_max) - 1000) / 1000.0) * 10.0, 1),
            'comparisons_made', v_session.current_step
        );
    ELSE
        -- Return next opponent
        v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
        v_opponent_id := v_session.candidate_ids[v_mid_idx + 1];

        SELECT pr.id, pr.restaurant_id, pr.elo_score, pr.photo_url,
               ROUND(((LEAST(GREATEST(pr.elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score,
               r.name AS restaurant_name
        INTO v_next_opp_record
        FROM personal_ratings pr
        JOIN restaurants r ON r.id = pr.restaurant_id
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
$$;
-- ============================================================
-- CORE: _update_profile_stats 
-- Internal Helper.
-- Updates the user's profile stats and credibility score.
-- ============================================================
CREATE OR REPLACE FUNCTION public._update_profile_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_ratings  INTEGER;
    v_total_battles  INTEGER;
    v_cred_scale     NUMERIC;
    v_credibility    NUMERIC;
BEGIN
    SELECT value INTO v_cred_scale FROM app_constants WHERE key = 'CREDIBILITY_SCALE';

    SELECT
        COUNT(*) FILTER (WHERE battle_status = 'completed'),
        COALESCE(SUM(comparison_count), 0)
    INTO v_total_ratings, v_total_battles
    FROM personal_ratings
    WHERE user_id = p_user_id;

    -- Credibility: log(1 + total_ratings) / log(1 + SCALE), capped at 1.0
    v_credibility := LEAST(
        LOG(1 + v_total_ratings) / LOG(1 + v_cred_scale),
        1.0
    );

    UPDATE profiles SET
        total_ratings = v_total_ratings,
        total_battles = v_total_battles,
        credibility_score = ROUND(v_credibility, 2),
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- CORE: _update_global_dish_score 
-- Internal Helper.
-- Recalculates the Bayesian leaderboard score for a given restaurant+dish_type.
-- ============================================================
CREATE OR REPLACE FUNCTION public._update_global_dish_score(
    p_restaurant_id UUID,
    p_dish_type_id  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_city_id              UUID;
    v_neighborhood_id      UUID;
    v_bayesian_c           NUMERIC;
    v_global_mean          NUMERIC;
    v_weighted_sum         NUMERIC;
    v_weighted_count       NUMERIC;
    v_total_ratings        INTEGER;
    v_bayesian_score       NUMERIC;
    v_raw_avg              NUMERIC;
    v_confidence           TEXT;
    v_featured_photo_url   TEXT;
    v_featured_rating_id   UUID;
BEGIN
    -- Get restaurant geography
    SELECT city_id, neighborhood_id
    INTO v_city_id, v_neighborhood_id
    FROM restaurants WHERE id = p_restaurant_id;

    -- Load Bayesian constant
    SELECT value INTO v_bayesian_c FROM app_constants WHERE key = 'BAYESIAN_C';

    -- Calculate city-level global mean for this dish type
    SELECT COALESCE(AVG(pr.derived_score), 5.0)
    INTO v_global_mean
    FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
    WHERE pr.dish_type_id = p_dish_type_id
      AND pr.battle_status = 'completed'
      AND r.city_id = v_city_id;

    -- Calculate weighted scores for this restaurant+dish
    SELECT
        COALESCE(SUM(pr.derived_score * p.credibility_score), 0),
        COALESCE(SUM(p.credibility_score), 0),
        COUNT(*),
        COALESCE(AVG(pr.derived_score), 0)
    INTO v_weighted_sum, v_weighted_count, v_total_ratings, v_raw_avg
    FROM personal_ratings pr
    JOIN profiles p ON p.id = pr.user_id
    WHERE pr.restaurant_id = p_restaurant_id
      AND pr.dish_type_id = p_dish_type_id
      AND pr.battle_status = 'completed';

    -- Bayesian average
    v_bayesian_score := (v_bayesian_c * v_global_mean + v_weighted_sum)
                      / (v_bayesian_c + v_weighted_count);

    -- Confidence tier
    v_confidence := CASE
        WHEN v_weighted_count < 2  THEN 'low'
        WHEN v_weighted_count < 5  THEN 'medium'
        WHEN v_weighted_count < 15 THEN 'high'
        ELSE 'very_high'
    END;

    -- Featured photo: pick highest-rated user's photo
    SELECT pr.photo_url, pr.id
    INTO v_featured_photo_url, v_featured_rating_id
    FROM personal_ratings pr
    WHERE pr.restaurant_id = p_restaurant_id
      AND pr.dish_type_id = p_dish_type_id
      AND pr.battle_status = 'completed'
      AND pr.photo_url IS NOT NULL
    ORDER BY pr.elo_score DESC
    LIMIT 1;

    -- Upsert global score
    INSERT INTO global_dish_scores (
        restaurant_id, dish_type_id, city_id, neighborhood_id,
        raw_weighted_avg, weighted_score_sum, weighted_rating_count,
        total_ratings, bayesian_score, confidence_tier,
        featured_photo_url, featured_rating_id,
        updated_at
    ) VALUES (
        p_restaurant_id, p_dish_type_id, v_city_id, v_neighborhood_id,
        v_raw_avg, v_weighted_sum, v_weighted_count,
        v_total_ratings, ROUND(v_bayesian_score, 2), v_confidence,
        v_featured_photo_url, v_featured_rating_id,
        now()
    )
    ON CONFLICT (restaurant_id, dish_type_id) DO UPDATE SET
        raw_weighted_avg     = EXCLUDED.raw_weighted_avg,
        weighted_score_sum   = EXCLUDED.weighted_score_sum,
        weighted_rating_count = EXCLUDED.weighted_rating_count,
        total_ratings        = EXCLUDED.total_ratings,
        bayesian_score       = EXCLUDED.bayesian_score,
        confidence_tier      = EXCLUDED.confidence_tier,
        featured_photo_url   = EXCLUDED.featured_photo_url,
        featured_rating_id   = EXCLUDED.featured_rating_id,
        updated_at           = now();
END;
$$;

-- ============================================================
-- LEADERBOARD: get_leaderboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_dish_type_id     UUID,
    p_city_id          UUID,
    p_neighborhood_id  UUID    DEFAULT NULL,
    p_limit            INTEGER DEFAULT 25,
    p_offset           INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_results JSONB;
BEGIN
    SELECT jsonb_agg(row_data ORDER BY rank_num)
    INTO v_results
    FROM (
        SELECT
            jsonb_build_object(
                'rank', ROW_NUMBER() OVER (ORDER BY gds.bayesian_score DESC),
                'restaurant_id', r.id,
                'restaurant_name', r.name,
                'address', r.address,
                'bayesian_score', ROUND(gds.bayesian_score, 1),
                'total_ratings', gds.total_ratings,
                'confidence_tier', gds.confidence_tier,
                'featured_photo_url', gds.featured_photo_url
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY gds.bayesian_score DESC) AS rank_num
        FROM global_dish_scores gds
        JOIN restaurants r ON r.id = gds.restaurant_id
        WHERE gds.dish_type_id = p_dish_type_id
          AND gds.city_id = p_city_id
          AND (p_neighborhood_id IS NULL OR gds.neighborhood_id = p_neighborhood_id)
          AND gds.total_ratings > 0
        ORDER BY gds.bayesian_score DESC
        LIMIT p_limit
        OFFSET p_offset
    ) ranked;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- Alias for backward compatibility
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_tiebreakers(
    p_city_id UUID, p_dish_type_id UUID, p_neighborhood_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 10
) RETURNS TABLE (rank BIGINT, restaurant_id UUID, restaurant_name TEXT, neighborhood_name TEXT,
                 bayesian_score NUMERIC, confidence_tier TEXT, raw_weighted_avg NUMERIC,
                 total_ratings INTEGER, featured_photo_url TEXT)
LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
    SELECT * FROM public.get_leaderboard(p_city_id, p_dish_type_id, p_neighborhood_id, p_limit);
$$;

-- ============================================================
-- LEADERBOARD: get_nearby_leaderboard (GPS-based)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(
    p_latitude      DOUBLE PRECISION,
    p_longitude     DOUBLE PRECISION,
    p_radius_meters INTEGER,
    p_dish_type_id  UUID,
    p_limit         INTEGER DEFAULT 10
) RETURNS TABLE (
    rank               BIGINT,
    restaurant_id      UUID,
    restaurant_name    TEXT,
    neighborhood_name  TEXT,
    distance_meters    DOUBLE PRECISION,
    bayesian_score     NUMERIC,
    confidence_tier    TEXT,
    raw_weighted_avg   NUMERIC,
    total_ratings      INTEGER,
    featured_photo_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
    v_user_point extensions.GEOGRAPHY;
BEGIN
    v_user_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY gds.bayesian_score DESC)::BIGINT AS rank,
        gds.restaurant_id,
        r.name  AS restaurant_name,
        n.name  AS neighborhood_name,
        ST_Distance(r.coordinates, v_user_point) AS distance_meters,
        gds.bayesian_score,
        gds.confidence_tier,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.dish_type_id  = p_dish_type_id
      AND ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
      AND gds.total_ratings >= 2
      AND r.is_closed = false
    ORDER BY gds.bayesian_score DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- PERSONAL: get_my_best_ever
-- Returns the top-rated dish (by derived_score) per dish type for a user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_best_ever(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    dish_type_id     UUID,
    dish_type_name   TEXT,
    dish_type_emoji  TEXT,
    rating_id        UUID,
    restaurant_id    UUID,
    restaurant_name  TEXT,
    city_name        TEXT,
    sentiment        TEXT,
    derived_score    NUMERIC,
    photo_url        TEXT,
    rated_at         TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    RETURN QUERY
    SELECT DISTINCT ON (pr.dish_type_id)
        pr.dish_type_id,
        dt.name         AS dish_type_name,
        dt.emoji        AS dish_type_emoji,
        pr.id           AS rating_id,
        pr.restaurant_id,
        r.name          AS restaurant_name,
        c.name          AS city_name,
        pr.sentiment,
        pr.derived_score,
        pr.photo_url,
        pr.created_at   AS rated_at
    FROM public.personal_ratings pr
    JOIN public.dish_types  dt ON dt.id = pr.dish_type_id
    JOIN public.restaurants r  ON r.id  = pr.restaurant_id
    LEFT JOIN public.cities c  ON c.id  = r.city_id
    WHERE pr.user_id = v_user_id AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$$;

-- ============================================================
-- PERSONAL: get_personal_rankings
-- Returns all of a user's ratings for a dish type, ordered by rank.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_personal_rankings(
    p_dish_type_id UUID,
    p_limit        INTEGER DEFAULT 50,
    p_offset       INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_results JSONB;
BEGIN
    SELECT jsonb_agg(row_data ORDER BY rank_num)
    INTO v_results
    FROM (
        SELECT
            jsonb_build_object(
                'rank', ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC),
                'rating_id', pr.id,
                'restaurant_id', r.id,
                'restaurant_name', r.name,
                'elo_score', pr.elo_score,
                'derived_score', pr.derived_score,
                'sentiment', pr.sentiment,
                'photo_url', pr.photo_url,
                'comparison_count', pr.comparison_count,
                'notes', pr.notes,
                'rated_at', pr.updated_at
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC) AS rank_num
        FROM personal_ratings pr
        JOIN restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id = v_user_id
          AND pr.dish_type_id = p_dish_type_id
          AND pr.battle_status = 'completed'
        ORDER BY pr.elo_score DESC
        LIMIT p_limit
        OFFSET p_offset
    ) ranked;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- ============================================================
-- PERSONAL: get_user_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_stats(
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_result  JSONB;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    SELECT jsonb_build_object(
        'user_id',          p.id,
        'username',         p.username,
        'total_ratings',    p.total_ratings,
        'total_battles',    p.total_battles,
        'credibility_score', p.credibility_score,
        'dishes_by_type',   (
            SELECT jsonb_object_agg(dt.name, cnt)
            FROM (
                SELECT dish_type_id, COUNT(*) AS cnt
                FROM public.personal_ratings WHERE user_id = v_user_id GROUP BY dish_type_id
            ) r JOIN public.dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',  (
            SELECT COUNT(DISTINCT r.city_id) FROM public.personal_ratings pr
            JOIN public.restaurants r ON r.id = pr.restaurant_id WHERE pr.user_id = v_user_id
        ),
        'member_since',     p.created_at,
        'skip_rate',        (
            SELECT ROUND(
                COUNT(*) FILTER (WHERE result = 'skipped')::DECIMAL / NULLIF(COUNT(*), 0), 3
            ) FROM public.comparisons WHERE user_id = v_user_id
        )
    )
    INTO v_result
    FROM public.profiles p WHERE p.id = v_user_id;

    RETURN v_result;
END;
$$;

-- ============================================================
-- PERSONAL: get_personal_dish_type_counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_personal_dish_type_counts(
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_result  JSONB;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    SELECT jsonb_object_agg(dt.name, cnt)
    INTO v_result
    FROM (
        SELECT dish_type_id, COUNT(*) AS cnt
        FROM public.personal_ratings WHERE user_id = v_user_id GROUP BY dish_type_id
    ) r JOIN public.dish_types dt ON dt.id = r.dish_type_id;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- ============================================================
-- DISCOVER: get_discover_heroes
-- Top-scoring restaurants the user hasn't rated yet.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_discover_heroes(
    p_city_name     TEXT             DEFAULT NULL,
    p_user_lat      DOUBLE PRECISION DEFAULT NULL,
    p_user_long     DOUBLE PRECISION DEFAULT NULL,
    p_radius_meters INTEGER          DEFAULT NULL,
    p_min_ratings   INTEGER          DEFAULT 2
) RETURNS TABLE (
    id                 UUID,
    restaurant_id      UUID,
    restaurant_name    TEXT,
    dish_type_id       UUID,
    city_id            UUID,
    neighborhood_id    UUID,
    neighborhood_name  TEXT,
    bayesian_score     NUMERIC,
    raw_weighted_avg   NUMERIC,
    total_ratings      INTEGER,
    confidence_tier    TEXT,
    featured_photo_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
    v_user_id    UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    v_user_id := auth.uid();
    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT gds.id, gds.restaurant_id, r.name AS restaurant_name,
           gds.dish_type_id, gds.city_id, gds.neighborhood_id, n.name AS neighborhood_name,
           gds.bayesian_score, gds.raw_weighted_avg, gds.total_ratings,
           gds.confidence_tier, gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r  ON r.id  = gds.restaurant_id
    LEFT JOIN public.cities   c  ON c.id  = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
      AND (p_city_name IS NULL OR c.name ILIKE p_city_name)
      AND (v_user_point IS NULL OR p_radius_meters IS NULL
           OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision))
      AND (v_user_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          ))
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$$;

-- ============================================================
-- DISCOVER: get_discover_rising_stars
-- High-scoring restaurants with few ratings (emerging gems).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(
    p_city_name     TEXT             DEFAULT NULL,
    p_user_lat      DOUBLE PRECISION DEFAULT NULL,
    p_user_long     DOUBLE PRECISION DEFAULT NULL,
    p_radius_meters INTEGER          DEFAULT NULL,
    p_min_score     DECIMAL          DEFAULT 7.5,
    p_max_ratings   INTEGER          DEFAULT 10,
    p_min_ratings   INTEGER          DEFAULT 2
) RETURNS TABLE (
    id                 UUID,
    restaurant_id      UUID,
    restaurant_name    TEXT,
    dish_type_id       UUID,
    dish_type_name     TEXT,
    dish_type_emoji    TEXT,
    city_id            UUID,
    neighborhood_id    UUID,
    neighborhood_name  TEXT,
    bayesian_score     NUMERIC,
    raw_weighted_avg   NUMERIC,
    total_ratings      INTEGER,
    confidence_tier    TEXT,
    featured_photo_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
    v_user_id    UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    v_user_id := auth.uid();
    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT gds.id, gds.restaurant_id, r.name AS restaurant_name,
           gds.dish_type_id, dt.name AS dish_type_name, dt.emoji AS dish_type_emoji,
           gds.city_id, gds.neighborhood_id, n.name AS neighborhood_name,
           gds.bayesian_score, gds.raw_weighted_avg, gds.total_ratings,
           gds.confidence_tier, gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r  ON r.id  = gds.restaurant_id
    JOIN public.dish_types    dt ON dt.id = gds.dish_type_id
    LEFT JOIN public.cities   c  ON c.id  = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.bayesian_score >= p_min_score
      AND gds.total_ratings < p_max_ratings
      AND gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
      AND (p_city_name IS NULL OR c.name ILIKE p_city_name)
      AND (v_user_point IS NULL OR p_radius_meters IS NULL
           OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision))
      AND (v_user_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          ))
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$$;

-- ============================================================
-- LOCATION: match_location
-- Returns city and neighborhood for a lat/long point.
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_location(
    lat  DOUBLE PRECISION,
    long DOUBLE PRECISION
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    _city_record         public.cities%ROWTYPE;
    _neighborhood_record public.neighborhoods%ROWTYPE;
    _point               extensions.geometry;
BEGIN
    _point := st_setsrid(st_point(long, lat), 4326);

    SELECT * INTO _city_record FROM public.cities
    WHERE is_active = true AND st_contains(coordinates::extensions.geometry, _point) LIMIT 1;

    IF _city_record IS NULL THEN
        SELECT * INTO _city_record FROM public.cities WHERE is_active = true
        ORDER BY coordinates::extensions.geometry <-> _point LIMIT 1;

        IF _city_record IS NOT NULL
           AND st_distance(_city_record.coordinates, _point::geography) > 50000 THEN
            _city_record := NULL;
        END IF;
    END IF;

    IF _city_record IS NOT NULL THEN
        SELECT * INTO _neighborhood_record FROM public.neighborhoods
        WHERE city_id = _city_record.id AND st_contains(boundary::extensions.geometry, _point) LIMIT 1;
    END IF;

    RETURN json_build_object(
        'city', CASE WHEN _city_record IS NULL THEN NULL ELSE
            json_build_object('id', _city_record.id, 'name', _city_record.name,
                              'state', _city_record.state, 'slug', _city_record.slug)
        END,
        'neighborhood', CASE WHEN _neighborhood_record IS NULL THEN NULL ELSE
            json_build_object('id', _neighborhood_record.id, 'name', _neighborhood_record.name,
                              'slug', _neighborhood_record.slug)
        END
    );
END;
$$;

-- ============================================================
-- LOCATION: check_city_is_new
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_city_is_new(
    p_city_id UUID
) RETURNS TABLE (is_new BOOLEAN, city_name TEXT, city_state TEXT, city_country TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT
        NOT c.is_active AS is_new,
        c.name         AS city_name,
        c.state        AS city_state,
        COALESCE(c.country, 'USA') AS city_country
    FROM public.cities c WHERE c.id = p_city_id;
$$;

-- ============================================================
-- RESTAURANT: find_nearby_restaurants
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(
    p_lat           DOUBLE PRECISION,
    p_long          DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 100.0,
    p_limit         INTEGER          DEFAULT 10
) RETURNS TABLE (
    id              UUID,
    name            TEXT,
    address         TEXT,
    city_id         UUID,
    neighborhood_id UUID,
    coordinates     extensions.geography,
    google_place_id TEXT,
    phone           TEXT,
    website         TEXT,
    is_verified     BOOLEAN,
    is_closed       BOOLEAN,
    closed_at       TIMESTAMPTZ,
    types           TEXT[],
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SET search_path = public, extensions AS $$
DECLARE
    v_user_point extensions.geography;
BEGIN
    v_user_point := extensions.ST_SetSRID(extensions.ST_MakePoint(p_long, p_lat), 4326)::extensions.geography;

    RETURN QUERY
    SELECT r.id, r.name, r.address, r.city_id, r.neighborhood_id, r.coordinates,
           r.google_place_id, r.phone, r.website, r.is_verified, r.is_closed,
           r.closed_at, r.types, r.created_at, r.updated_at,
           extensions.ST_Distance(r.coordinates, v_user_point) AS distance_meters
    FROM public.restaurants r
    WHERE r.coordinates IS NOT NULL AND extensions.ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
    ORDER BY distance_meters ASC LIMIT p_limit;
END;
$$;

-- ============================================================
-- RESTAURANT: upsert_restaurant_from_google
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_restaurant_from_google(
    p_google_place_id TEXT,
    p_name            TEXT,
    p_address         TEXT,
    p_city_name       TEXT,
    p_state           TEXT,
    p_country         TEXT,
    p_neighborhood_name TEXT DEFAULT NULL,
    p_lat             FLOAT8 DEFAULT NULL,
    p_lng             FLOAT8 DEFAULT NULL,
    p_phone           TEXT DEFAULT NULL,
    p_website         TEXT DEFAULT NULL,
    p_types           TEXT[] DEFAULT NULL
) RETURNS SETOF public.restaurants
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_city_id        UUID;
    v_neighborhood_id UUID;
    v_city_slug      TEXT;
    v_coordinates    extensions.geography(Point, 4326);
    v_city_record    public.cities%ROWTYPE;
    v_point          extensions.geometry;
BEGIN
    -- Resolve city
    SELECT * INTO v_city_record FROM public.cities
    WHERE lower(name) = lower(p_city_name)
      AND (p_state IS NULL OR lower(state) = lower(p_state)) LIMIT 1;

    IF v_city_record.id IS NOT NULL THEN
        v_city_id := v_city_record.id;
    ELSE
        v_city_slug := public.slugify(p_city_name || '-' || COALESCE(p_state, ''));
        INSERT INTO public.cities (name, state, country, slug, is_active, coordinates)
        VALUES (p_city_name, p_state, p_country, v_city_slug, false,
                CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
                     THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography ELSE NULL END)
        ON CONFLICT (slug) DO NOTHING RETURNING id INTO v_city_id;

        IF v_city_id IS NULL THEN
            SELECT id INTO v_city_id FROM public.cities
            WHERE lower(name) = lower(p_city_name)
              AND (p_state IS NULL OR lower(state) = lower(p_state));
        END IF;
    END IF;

    -- Resolve neighborhood (match only, never auto-create)
    IF v_city_id IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_point := st_setsrid(st_point(p_lng, p_lat), 4326);
        SELECT id INTO v_neighborhood_id FROM public.neighborhoods
        WHERE city_id = v_city_id AND st_contains(boundary::extensions.geometry, v_point) LIMIT 1;

        IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
            SELECT id INTO v_neighborhood_id FROM public.neighborhoods
            WHERE lower(name) = lower(p_neighborhood_name) AND city_id = v_city_id;
        END IF;
    ELSIF v_city_id IS NOT NULL AND p_neighborhood_name IS NOT NULL THEN
        SELECT id INTO v_neighborhood_id FROM public.neighborhoods
        WHERE lower(name) = lower(p_neighborhood_name) AND city_id = v_city_id;
    END IF;

    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_coordinates := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    INSERT INTO public.restaurants (google_place_id, name, address, city_id, neighborhood_id,
                                    coordinates, phone, website, types, updated_at)
    VALUES (p_google_place_id, p_name, p_address, v_city_id, v_neighborhood_id,
            v_coordinates, p_phone, p_website, p_types, now())
    ON CONFLICT (google_place_id) DO UPDATE
    SET name            = EXCLUDED.name,
        address         = EXCLUDED.address,
        city_id         = COALESCE(public.restaurants.city_id, EXCLUDED.city_id),
        neighborhood_id = COALESCE(public.restaurants.neighborhood_id, EXCLUDED.neighborhood_id),
        coordinates     = EXCLUDED.coordinates,
        phone           = EXCLUDED.phone,
        website         = EXCLUDED.website,
        types           = EXCLUDED.types,
        updated_at      = now()
    RETURNING *;
END;
$$;

-- ============================================================
-- SEARCH: search_restaurants (fuzzy, pg_trgm)
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_restaurants(search_term TEXT)
RETURNS SETOF public.restaurants LANGUAGE SQL STABLE AS $$
    SELECT * FROM public.restaurants
    WHERE similarity(name, search_term) > 0.15
       OR similarity(replace(name, ' ', ''), search_term) > 0.15
       OR name ILIKE '%' || search_term || '%'
    ORDER BY greatest(similarity(name, search_term),
                      similarity(replace(name, ' ', ''), search_term)) DESC
    LIMIT 20;
$$;

-- ============================================================
-- SEARCH: search_dish_types (fuzzy + aliases, pg_trgm)
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_dish_types(search_term TEXT)
RETURNS SETOF public.dish_types LANGUAGE SQL STABLE AS $$
    SELECT * FROM public.dish_types
    WHERE is_active = true
      AND (
          similarity(name, search_term) > 0.15
          OR similarity(replace(name, ' ', ''), search_term) > 0.15
          OR name ILIKE '%' || search_term || '%'
          OR EXISTS (
              SELECT 1 FROM unnest(aliases) alias
              WHERE alias ILIKE '%' || search_term || '%'
                 OR similarity(alias, search_term) > 0.15
          )
      )
    ORDER BY greatest(similarity(name, search_term),
                      similarity(replace(name, ' ', ''), search_term)) DESC
    LIMIT 20;
$$;

-- ============================================================
-- SEARCH: search_restaurant_dishes
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_restaurant_dishes(search_term TEXT)
RETURNS TABLE (
    restaurant_dish_id UUID,
    dish_type_id       UUID,
    dish_type_name     TEXT,
    dish_type_emoji    TEXT,
    restaurant_id      UUID,
    restaurant_name    TEXT,
    photos             TEXT[],
    total_ratings      INTEGER
) LANGUAGE SQL STABLE AS $$
    SELECT rd.id, dt.id, dt.name, dt.emoji, r.id, r.name, rd.photos, rd.total_ratings
    FROM public.restaurant_dishes rd
    JOIN public.dish_types  dt ON dt.id = rd.dish_type_id
    JOIN public.restaurants r  ON r.id  = rd.restaurant_id
    WHERE similarity(dt.name, search_term) > 0.15
       OR similarity(replace(dt.name, ' ', ''), search_term) > 0.15
       OR dt.name ILIKE '%' || search_term || '%'
    ORDER BY greatest(similarity(dt.name, search_term),
                      similarity(replace(dt.name, ' ', ''), search_term)) DESC
    LIMIT 20;
$$;

-- ============================================================
-- ADMIN: is_admin (already defined in draft_02 — this is a no-op refresh)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ============================================================
-- ADMIN: get_admin_city_breakdown
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_city_breakdown()
RETURNS TABLE (
    city_id          UUID,
    city_name        TEXT,
    total_ratings    BIGINT,
    total_battles    BIGINT,
    total_restaurants BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT
        c.id AS city_id,
        c.name AS city_name,
        (SELECT COUNT(*) FROM public.personal_ratings pr
         JOIN public.restaurants res ON res.id = pr.restaurant_id
         WHERE res.city_id = c.id) AS total_ratings,
        (SELECT COUNT(*) FROM public.comparisons comp
         WHERE comp.user_id IN (
             SELECT pr.user_id FROM public.personal_ratings pr
             JOIN public.restaurants res ON res.id = pr.restaurant_id
             WHERE res.city_id = c.id
         )) AS total_battles,
        (SELECT COUNT(*) FROM public.restaurants WHERE city_id = c.id) AS total_restaurants
    FROM public.cities c WHERE c.is_active = true
    ORDER BY total_ratings DESC;
$$;

-- ============================================================
-- ADMIN: get_admin_daily_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_daily_stats(
    p_start_date DATE DEFAULT (CURRENT_DATE - '30 days'::INTERVAL)::DATE,
    p_end_date   DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (day DATE, new_users BIGINT, new_ratings BIGINT, new_battles BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
    WITH dates AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::INTERVAL)::DATE AS day
    )
    SELECT
        d.day,
        COALESCE((SELECT COUNT(*) FROM public.profiles   WHERE created_at::DATE = d.day), 0) AS new_users,
        COALESCE((SELECT COUNT(*) FROM public.personal_ratings WHERE created_at::DATE = d.day), 0) AS new_ratings,
        COALESCE((SELECT COUNT(*) FROM public.comparisons WHERE created_at::DATE = d.day), 0) AS new_battles
    FROM dates d ORDER BY d.day;
$$;

-- ============================================================
-- ADMIN: get_admin_dish_type_breakdown
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_dish_type_breakdown()
RETURNS TABLE (
    dish_type_id   UUID,
    dish_type_name TEXT,
    total_ratings  BIGINT,
    total_battles  BIGINT,
    avg_score      NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT
        dt.id AS dish_type_id,
        dt.name AS dish_type_name,
        (SELECT COUNT(*) FROM public.personal_ratings WHERE dish_type_id = dt.id) AS total_ratings,
        (SELECT COUNT(*) FROM public.comparisons WHERE dish_type_id = dt.id) AS total_battles,
        (SELECT ROUND(AVG(derived_score)::NUMERIC, 1) FROM public.personal_ratings WHERE dish_type_id = dt.id) AS avg_score
    FROM public.dish_types dt WHERE dt.is_active = true
    ORDER BY total_ratings DESC;
$$;

