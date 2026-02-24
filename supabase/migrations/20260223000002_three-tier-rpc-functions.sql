-- =============================================================================
-- Migration: Three-Tier Rating System — RPC Functions
--
-- Creates/replaces all RPC functions for the new sentiment + binary insertion
-- sort rating system.  Apply AFTER 20260223000001_three-tier-schema.sql.
--
-- Function dependency order (bottom-up):
--   recalculate_derived_scores   ← internal helper
--   compute_community_score      ← calls recalculate_derived_scores indirectly
--   create_rating                ← entry point; calls both helpers
--   process_battle               ← calls both helpers on convergence
--   skip_battle                  ← calls both helpers on forced completion
--   get_leaderboard / get_nearby_leaderboard  ← leaderboard queries
--   get_my_best_ever / get_my_dish_rankings   ← personal ranking queries
--   get_user_stats               ← profile stats
--   get_discover_heroes / get_discover_rising_stars  ← discover page
-- =============================================================================


-- ============================================
-- recalculate_derived_scores
-- Internal helper called after every rank change.
-- Recomputes derived_score for every rated item in a user's dish-type list
-- using bucket-anchored interpolation.
-- ============================================
CREATE OR REPLACE FUNCTION public.recalculate_derived_scores(
    p_user_id      UUID,
    p_dish_type_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_sentiments TEXT[]    := ARRAY['liked', 'okay', 'disliked'];
    v_floors     NUMERIC[] := ARRAY[7.0,     4.0,    1.0];
    v_ceilings   NUMERIC[] := ARRAY[10.0,    6.9,    3.9];
    i INT;
BEGIN
    FOR i IN 1..3 LOOP
        -- For each item in this sentiment zone, assign a score derived from
        -- its zone-relative rank.  rank 1 = best (highest score), rank n = worst.
        -- Formula: score = ceiling − ((rank−1)/(n−1)) × (ceiling−floor)
        -- Edge case (n=1): score = midpoint
        UPDATE public.personal_ratings pr
        SET derived_score = ROUND(
            CASE
                WHEN zone.n = 1
                    THEN (v_ceilings[i] + v_floors[i]) / 2.0
                ELSE
                    v_ceilings[i]
                    - ((zone.zone_rank - 1)::NUMERIC / (zone.n - 1)::NUMERIC)
                    * (v_ceilings[i] - v_floors[i])
            END, 2)
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (ORDER BY rank_position ASC) AS zone_rank,
                COUNT(*)     OVER ()                           AS n
            FROM public.personal_ratings
            WHERE user_id      = p_user_id
              AND dish_type_id = p_dish_type_id
              AND sentiment    = v_sentiments[i]
              AND rank_position IS NOT NULL
        ) zone
        WHERE pr.id = zone.id;
    END LOOP;
END;
$$;


-- ============================================
-- compute_community_score
-- Recomputes the Bayesian community score for a restaurant/dish_type pair.
-- Called after every insert or battle completion.
-- ============================================
CREATE OR REPLACE FUNCTION public.compute_community_score(
    p_restaurant_id UUID,
    p_dish_type_id  UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    C                      CONSTANT NUMERIC := 5;  -- prior strength
    v_total_ratings        INTEGER;
    v_weighted_score_sum   NUMERIC;
    v_weighted_rating_cnt  NUMERIC;
    v_raw_weighted_avg     NUMERIC;
    v_global_mean          NUMERIC;
    v_bayesian_score       NUMERIC;
    v_confidence_tier      TEXT;
BEGIN
    -- Aggregate ratings for this restaurant/dish combination
    SELECT
        COUNT(*),
        SUM(derived_score),
        SUM(1.0)  -- w_i = 1.0 (all v0.1 ratings have mandatory photos)
    INTO v_total_ratings, v_weighted_score_sum, v_weighted_rating_cnt
    FROM public.personal_ratings
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND derived_score IS NOT NULL;

    IF COALESCE(v_total_ratings, 0) = 0 THEN RETURN; END IF;

    v_raw_weighted_avg := v_weighted_score_sum / NULLIF(v_weighted_rating_cnt, 0);

    -- Global mean for the same dish_type across other restaurants in same city
    SELECT COALESCE(AVG(gds2.raw_weighted_avg), 5.0)
    INTO v_global_mean
    FROM public.global_dish_scores gds1
    JOIN public.global_dish_scores gds2
      ON gds2.city_id      = gds1.city_id
     AND gds2.dish_type_id = p_dish_type_id
     AND gds2.restaurant_id != p_restaurant_id
    WHERE gds1.restaurant_id = p_restaurant_id
      AND gds1.dish_type_id  = p_dish_type_id;

    IF v_global_mean IS NULL THEN v_global_mean := 5.0; END IF;

    -- Bayesian-smoothed score
    v_bayesian_score := ROUND(
        (v_weighted_score_sum + C * v_global_mean)
        / (v_weighted_rating_cnt + C),
        2
    );

    -- Confidence tier  (C = 5)
    -- < C → low | C–2C → medium | 2C–5C → high | > 5C → very_high
    v_confidence_tier := CASE
        WHEN v_weighted_rating_cnt >= 25 THEN 'very_high'
        WHEN v_weighted_rating_cnt >= 10 THEN 'high'
        WHEN v_weighted_rating_cnt >= C  THEN 'medium'
        ELSE                                  'low'
    END;

    -- Upsert running totals + derived scores into global_dish_scores
    UPDATE public.global_dish_scores
    SET
        raw_weighted_avg      = v_raw_weighted_avg,
        weighted_score_sum    = v_weighted_score_sum,
        weighted_rating_count = v_weighted_rating_cnt,
        total_ratings         = v_total_ratings,
        bayesian_score        = v_bayesian_score,
        confidence_tier       = v_confidence_tier,
        updated_at            = now()
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id;
END;
$$;


-- ============================================
-- create_rating
-- Main entry point.  Replaces post_rating_and_get_duel.
-- Returns JSONB: { rating_id, has_battle } or { rating_id, has_battle, battle_id, step, max_steps, skips_remaining, opponent }
-- ============================================
DROP FUNCTION IF EXISTS public.create_rating(UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN, UUID[]);

CREATE OR REPLACE FUNCTION public.create_rating(
    p_restaurant_id       UUID,
    p_dish_type_id        UUID,
    p_sentiment           TEXT,
    p_photo_url           TEXT,
    p_photo_storage_path  TEXT      DEFAULT NULL,
    p_variation_id        UUID      DEFAULT NULL,
    p_notes               TEXT      DEFAULT NULL,
    p_location_verified   BOOLEAN   DEFAULT FALSE,
    p_taste_tag_ids       UUID[]    DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id              UUID := auth.uid();
    v_new_rating_id        UUID;
    v_is_new_insert        BOOLEAN;
    v_city_id              UUID;
    v_neighborhood_id      UUID;
    v_zone_size            INTEGER;
    v_count_liked          INTEGER;
    v_count_okay           INTEGER;
    v_insert_position      INTEGER;
    v_floor                NUMERIC;
    v_ceiling              NUMERIC;
    v_zone_start           INTEGER;
    v_mid                  INTEGER;
    v_opponent_id          UUID;
    v_opponent_restaurant  TEXT;
    v_opponent_photo       TEXT;
    v_opponent_score       NUMERIC;
    v_battle_id            UUID;
    v_max_battles          INTEGER;
    v_max_skips            INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF p_sentiment NOT IN ('liked','okay','disliked') THEN
        RAISE EXCEPTION 'Invalid sentiment: %', p_sentiment;
    END IF;

    -- Resolve restaurant location
    SELECT city_id, neighborhood_id
    INTO v_city_id, v_neighborhood_id
    FROM public.restaurants WHERE id = p_restaurant_id;

    -- Check if this is a re-rating (existing row) to avoid double-counting total_ratings
    SELECT id INTO v_new_rating_id
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id;

    v_is_new_insert := (v_new_rating_id IS NULL);

    -- INSERT or re-rate (reset rank/score so battles restart)
    INSERT INTO public.personal_ratings (
        user_id, restaurant_id, dish_type_id, variation_id,
        photo_url, photo_storage_path, sentiment, notes,
        location_verified, rank_position, derived_score
    )
    VALUES (
        v_user_id, p_restaurant_id, p_dish_type_id, p_variation_id,
        p_photo_url, p_photo_storage_path, p_sentiment, p_notes,
        COALESCE(p_location_verified, false), NULL, NULL
    )
    ON CONFLICT (user_id, restaurant_id, dish_type_id) DO UPDATE
    SET sentiment          = EXCLUDED.sentiment,
        photo_url          = EXCLUDED.photo_url,
        photo_storage_path = EXCLUDED.photo_storage_path,
        variation_id       = EXCLUDED.variation_id,
        notes              = EXCLUDED.notes,
        location_verified  = EXCLUDED.location_verified,
        rank_position      = NULL,
        derived_score      = NULL,
        updated_at         = now()
    RETURNING id INTO v_new_rating_id;

    -- Upsert taste tags (replace on re-rating)
    IF p_taste_tag_ids IS NOT NULL AND array_length(p_taste_tag_ids, 1) > 0 THEN
        DELETE FROM public.personal_rating_tags WHERE rating_id = v_new_rating_id;
        INSERT INTO public.personal_rating_tags (rating_id, tag_id)
        SELECT v_new_rating_id, unnest(p_taste_tag_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Increment total_ratings only for first-time ratings
    IF v_is_new_insert THEN
        UPDATE public.profiles
        SET total_ratings = total_ratings + 1
        WHERE id = v_user_id;
    END IF;

    -- Ensure a global_dish_scores row exists (don't set scores yet)
    INSERT INTO public.global_dish_scores (
        restaurant_id, dish_type_id, city_id, neighborhood_id, total_ratings
    )
    VALUES (p_restaurant_id, p_dish_type_id, v_city_id, v_neighborhood_id, 0)
    ON CONFLICT (restaurant_id, dish_type_id) DO NOTHING;

    -- Count existing items in the same sentiment zone (excluding the new/re-rated item)
    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = p_dish_type_id
      AND sentiment    = p_sentiment
      AND rank_position IS NOT NULL
      AND id            != v_new_rating_id;

    IF v_zone_size = 0 THEN
        -- ── No existing zone items: place immediately ──────────────────────────

        -- Determine zone_start for this sentiment
        SELECT COUNT(*) INTO v_count_liked
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = 'liked'
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        SELECT COUNT(*) INTO v_count_okay
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = 'okay'
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        v_insert_position := CASE p_sentiment
            WHEN 'liked'    THEN 1
            WHEN 'okay'     THEN v_count_liked + 1
            ELSE                 v_count_liked + v_count_okay + 1
        END;

        -- Shift items with rank_position ≥ insert_position to open a slot
        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND rank_position >= v_insert_position
          AND id            != v_new_rating_id
          AND rank_position IS NOT NULL;

        -- Compute zone midpoint score
        CASE p_sentiment
            WHEN 'liked'    THEN v_floor := 7.0; v_ceiling := 10.0;
            WHEN 'okay'     THEN v_floor := 4.0; v_ceiling := 6.9;
            ELSE                 v_floor := 1.0; v_ceiling := 3.9;
        END CASE;

        UPDATE public.personal_ratings
        SET rank_position = v_insert_position,
            derived_score = ROUND((v_ceiling + v_floor) / 2.0, 2)
        WHERE id = v_new_rating_id;

        -- Recalculate all derived scores and update community score
        PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
        PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);

        RETURN jsonb_build_object(
            'rating_id',  v_new_rating_id,
            'has_battle', false
        );

    ELSE
        -- ── Zone has items: start binary insertion sort battle ─────────────────

        v_max_battles := floor(log(2, v_zone_size::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        -- Zone start = lowest rank_position among existing same-sentiment items
        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = p_sentiment
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        -- Initial midpoint opponent (0-indexed within zone)
        v_mid := floor((v_zone_size - 1)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_opponent_id, v_opponent_restaurant, v_opponent_photo, v_opponent_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id      = v_user_id
          AND pr.dish_type_id = p_dish_type_id
          AND pr.rank_position = v_zone_start + v_mid
          AND pr.id            != v_new_rating_id;

        -- Defensive fallback: if opponent lookup fails, place without battle
        IF v_opponent_id IS NULL THEN
            RAISE WARNING 'create_rating: opponent not found at rank %. Placing without battle.', v_zone_start + v_mid;

            SELECT MIN(rank_position) INTO v_insert_position
            FROM public.personal_ratings
            WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
              AND sentiment = p_sentiment AND rank_position IS NOT NULL AND id != v_new_rating_id;

            UPDATE public.personal_ratings
            SET rank_position = COALESCE(v_insert_position, 1),
                derived_score = CASE p_sentiment
                    WHEN 'liked' THEN 8.5 WHEN 'okay' THEN 5.5 ELSE 2.5
                END
            WHERE id = v_new_rating_id;
            PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
            PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);
            RETURN jsonb_build_object('rating_id', v_new_rating_id, 'has_battle', false);
        END IF;

        -- Create first comparison record
        INSERT INTO public.comparisons (
            user_id, dish_type_id,
            new_rating_id, opponent_rating_id,
            low_bound, high_bound, step_number
        )
        VALUES (
            v_user_id, p_dish_type_id,
            v_new_rating_id, v_opponent_id,
            0, v_zone_size - 1, 1
        )
        RETURNING id INTO v_battle_id;

        RETURN jsonb_build_object(
            'rating_id',       v_new_rating_id,
            'has_battle',      true,
            'battle_id',       v_battle_id,
            'step',            1,
            'max_steps',       v_max_battles,
            'skips_remaining', v_max_skips,
            'opponent', jsonb_build_object(
                'rating_id',       v_opponent_id,
                'restaurant_name', v_opponent_restaurant,
                'photo_url',       v_opponent_photo,
                'derived_score',   v_opponent_score
            )
        );
    END IF;
END;
$$;


-- ============================================
-- process_battle
-- Processes a vote in the binary insertion sort sequence.
-- Returns { done: true, rank_position, derived_score }
--      or { done: false, next_battle_id, step, max_steps, skips_remaining, opponent }
-- ============================================
DROP FUNCTION IF EXISTS public.process_battle(UUID, UUID);

CREATE OR REPLACE FUNCTION public.process_battle(
    p_battle_id        UUID,
    p_winner_rating_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id          UUID := auth.uid();
    v_battle           record;
    v_new_rating       record;
    v_mid              INTEGER;
    v_new_low          INTEGER;
    v_new_high         INTEGER;
    v_zone_start       INTEGER;
    v_insert_rank      INTEGER;
    v_zone_size        INTEGER;
    v_max_battles      INTEGER;
    v_max_skips        INTEGER;
    v_existing_skips   INTEGER;
    v_skips_remaining  INTEGER;
    v_next_rank        INTEGER;
    v_next_id          UUID;
    v_next_restaurant  TEXT;
    v_next_photo       TEXT;
    v_next_score       NUMERIC;
    v_next_battle_id   UUID;
    v_final_score      NUMERIC;
BEGIN
    SELECT * INTO v_battle FROM public.comparisons WHERE id = p_battle_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Battle not found: %', p_battle_id; END IF;
    IF v_battle.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_battle.result  IS NOT NULL  THEN RAISE EXCEPTION 'Battle already resolved'; END IF;
    IF p_winner_rating_id != v_battle.new_rating_id
   AND p_winner_rating_id != v_battle.opponent_rating_id THEN
        RAISE EXCEPTION 'Invalid winner_rating_id';
    END IF;

    SELECT * INTO v_new_rating
    FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    -- Narrow the search window
    v_mid := floor((v_battle.low_bound + v_battle.high_bound)::NUMERIC / 2)::INTEGER;

    IF p_winner_rating_id = v_battle.new_rating_id THEN
        -- New item wins → insert in lower (better) half
        v_new_low  := v_battle.low_bound;
        v_new_high := v_mid;
        UPDATE public.comparisons SET result = 'new_wins'      WHERE id = p_battle_id;
    ELSE
        -- Opponent wins → insert in upper (worse) half
        v_new_low  := v_mid + 1;
        v_new_high := v_battle.high_bound;
        UPDATE public.comparisons SET result = 'opponent_wins' WHERE id = p_battle_id;
    END IF;

    -- Increment battle count
    UPDATE public.profiles SET total_battles = total_battles + 1 WHERE id = v_user_id;

    IF v_new_low >= v_new_high THEN
        -- ── Converged: insert at final position ───────────────────────────────

        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_insert_rank := v_zone_start + v_new_low;

        -- Shift items to make room
        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank
          AND id            != v_battle.new_rating_id
          AND rank_position IS NOT NULL;

        -- Place new item
        UPDATE public.personal_ratings
        SET rank_position = v_insert_rank
        WHERE id = v_battle.new_rating_id;

        -- Recalculate scores and community leaderboard
        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score
        FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object(
            'done',         true,
            'rank_position', v_insert_rank,
            'derived_score', v_final_score
        );

    ELSE
        -- ── Continue: find next opponent ──────────────────────────────────────

        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_next_rank := v_zone_start + floor((v_new_low + v_new_high)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_next_id, v_next_restaurant, v_next_photo, v_next_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id      = v_user_id
          AND pr.dish_type_id = v_battle.dish_type_id
          AND pr.rank_position = v_next_rank
          AND pr.id            != v_battle.new_rating_id;

        -- Compute max_battles / skips_remaining
        SELECT COUNT(*) INTO v_zone_size
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        SELECT COUNT(*) INTO v_existing_skips
        FROM public.comparisons
        WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

        v_skips_remaining := v_max_skips - v_existing_skips;

        -- Create next battle record
        INSERT INTO public.comparisons (
            user_id, dish_type_id,
            new_rating_id, opponent_rating_id,
            low_bound, high_bound, step_number
        )
        VALUES (
            v_user_id, v_battle.dish_type_id,
            v_battle.new_rating_id, v_next_id,
            v_new_low, v_new_high,
            v_battle.step_number + 1
        )
        RETURNING id INTO v_next_battle_id;

        RETURN jsonb_build_object(
            'done',            false,
            'next_battle_id',  v_next_battle_id,
            'step',            v_battle.step_number + 1,
            'max_steps',       v_max_battles,
            'skips_remaining', v_skips_remaining,
            'opponent', jsonb_build_object(
                'rating_id',       v_next_id,
                'restaurant_name', v_next_restaurant,
                'photo_url',       v_next_photo,
                'derived_score',   v_next_score
            )
        );
    END IF;
END;
$$;


-- ============================================
-- skip_battle
-- Skips the current battle step, creates next step with a different opponent.
-- If the remaining search range is a single item, forces completion.
-- Returns same shape as process_battle.
-- ============================================
DROP FUNCTION IF EXISTS public.skip_battle(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.skip_battle(
    p_battle_id   UUID,
    p_skip_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id          UUID := auth.uid();
    v_battle           record;
    v_new_rating       record;
    v_zone_size        INTEGER;
    v_max_battles      INTEGER;
    v_max_skips        INTEGER;
    v_existing_skips   INTEGER;
    v_zone_start       INTEGER;
    v_insert_rank      INTEGER;
    v_final_score      NUMERIC;
    v_mid              INTEGER;
    v_alt_mid          INTEGER;
    v_next_rank        INTEGER;
    v_next_id          UUID;
    v_next_restaurant  TEXT;
    v_next_photo       TEXT;
    v_next_score       NUMERIC;
    v_next_battle_id   UUID;
BEGIN
    SELECT * INTO v_battle FROM public.comparisons WHERE id = p_battle_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Battle not found: %', p_battle_id; END IF;
    IF v_battle.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_battle.result  IS NOT NULL  THEN RAISE EXCEPTION 'Battle already resolved'; END IF;

    SELECT * INTO v_new_rating
    FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    -- Compute skip limits
    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = v_battle.dish_type_id
      AND sentiment    = v_new_rating.sentiment
      AND rank_position IS NOT NULL
      AND id            != v_battle.new_rating_id;

    v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
    v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

    SELECT COUNT(*) INTO v_existing_skips
    FROM public.comparisons
    WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

    IF v_existing_skips >= v_max_skips THEN
        RAISE EXCEPTION 'No skips remaining for this battle sequence';
    END IF;

    -- Record the skip
    UPDATE public.comparisons
    SET result      = 'skipped',
        skip_reason = p_skip_reason
    WHERE id = p_battle_id;

    SELECT MIN(rank_position) INTO v_zone_start
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = v_battle.dish_type_id
      AND sentiment    = v_new_rating.sentiment
      AND rank_position IS NOT NULL
      AND id            != v_battle.new_rating_id;

    -- Single-item range: force completion at current position
    IF v_battle.low_bound >= v_battle.high_bound THEN
        v_insert_rank := v_zone_start + v_battle.low_bound;

        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank
          AND id            != v_battle.new_rating_id
          AND rank_position IS NOT NULL;

        UPDATE public.personal_ratings
        SET rank_position = v_insert_rank
        WHERE id = v_battle.new_rating_id;

        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score
        FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object(
            'done',         true,
            'rank_position', v_insert_rank,
            'derived_score', v_final_score
        );
    END IF;

    -- Multi-item range: advance to a different opponent (mid ± 1)
    v_mid := floor((v_battle.low_bound + v_battle.high_bound)::NUMERIC / 2)::INTEGER;
    v_alt_mid := CASE
        WHEN v_mid + 1 <= v_battle.high_bound THEN v_mid + 1
        ELSE v_mid - 1
    END;

    v_next_rank := v_zone_start + v_alt_mid;

    SELECT pr.id, r.name, pr.photo_url, pr.derived_score
    INTO v_next_id, v_next_restaurant, v_next_photo, v_next_score
    FROM public.personal_ratings pr
    JOIN public.restaurants r ON r.id = pr.restaurant_id
    WHERE pr.user_id      = v_user_id
      AND pr.dish_type_id = v_battle.dish_type_id
      AND pr.rank_position = v_next_rank
      AND pr.id            != v_battle.new_rating_id;

    INSERT INTO public.comparisons (
        user_id, dish_type_id,
        new_rating_id, opponent_rating_id,
        low_bound, high_bound, step_number
    )
    VALUES (
        v_user_id, v_battle.dish_type_id,
        v_battle.new_rating_id, v_next_id,
        v_battle.low_bound, v_battle.high_bound,
        v_battle.step_number + 1
    )
    RETURNING id INTO v_next_battle_id;

    RETURN jsonb_build_object(
        'done',            false,
        'next_battle_id',  v_next_battle_id,
        'step',            v_battle.step_number + 1,
        'max_steps',       v_max_battles,
        'skips_remaining', v_max_skips - v_existing_skips - 1,
        'opponent', jsonb_build_object(
            'rating_id',       v_next_id,
            'restaurant_name', v_next_restaurant,
            'photo_url',       v_next_photo,
            'derived_score',   v_next_score
        )
    );
END;
$$;


-- ============================================
-- get_leaderboard
-- Updated: removes p_min_battles, returns bayesian_score + confidence_tier.
-- Must DROP first because return type changes.
-- ============================================
DROP FUNCTION IF EXISTS public.get_leaderboard(UUID, UUID, UUID, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_leaderboard(UUID, UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_city_id           UUID,
    p_dish_type_id      UUID,
    p_neighborhood_id   UUID    DEFAULT NULL,
    p_limit             INTEGER DEFAULT 10,
    p_min_ratings       INTEGER DEFAULT 2
) RETURNS TABLE (
    rank               BIGINT,
    restaurant_id      UUID,
    restaurant_name    TEXT,
    neighborhood_name  TEXT,
    bayesian_score     NUMERIC,
    confidence_tier    TEXT,
    raw_weighted_avg   NUMERIC,
    total_ratings      INTEGER,
    featured_photo_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (
            ORDER BY gds.bayesian_score DESC,
                     gds.raw_weighted_avg DESC,
                     gds.total_ratings DESC,
                     gds.created_at ASC
        )::BIGINT       AS rank,
        gds.restaurant_id,
        r.name          AS restaurant_name,
        n.name          AS neighborhood_name,
        gds.bayesian_score,
        gds.confidence_tier,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.city_id      = p_city_id
      AND gds.dish_type_id = p_dish_type_id
      AND (p_neighborhood_id IS NULL OR gds.neighborhood_id = p_neighborhood_id)
      AND gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
    ORDER BY gds.bayesian_score DESC,
             gds.raw_weighted_avg DESC,
             gds.total_ratings DESC
    LIMIT p_limit;
END;
$$;

-- Aliases for backward compatibility
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_tiebreakers(
    p_city_id UUID, p_dish_type_id UUID, p_neighborhood_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 10
) RETURNS TABLE (rank BIGINT, restaurant_id UUID, restaurant_name TEXT, neighborhood_name TEXT,
                 bayesian_score NUMERIC, confidence_tier TEXT, raw_weighted_avg NUMERIC,
                 total_ratings INTEGER, featured_photo_url TEXT)
LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
    SELECT * FROM public.get_leaderboard(p_city_id, p_dish_type_id, p_neighborhood_id, p_limit);
$$;


-- ============================================
-- get_nearby_leaderboard
-- Updated: removes global_elo / total_battles, adds bayesian_score / confidence_tier.
-- ============================================
DROP FUNCTION IF EXISTS public.get_nearby_leaderboard(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_nearby_leaderboard(numeric, numeric, integer, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(
    p_latitude     DOUBLE PRECISION,
    p_longitude    DOUBLE PRECISION,
    p_radius_meters INTEGER,
    p_dish_type_id UUID,
    p_limit        INTEGER DEFAULT 10
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


-- ============================================
-- get_my_best_ever
-- Updated: returns derived_score + sentiment, removes raw_score / personal_elo.
-- Must DROP first (return type changes).
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_best_ever(UUID);

CREATE OR REPLACE FUNCTION public.get_my_best_ever(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    dish_type_id      UUID,
    dish_type_name    TEXT,
    dish_type_emoji   TEXT,
    rating_id         UUID,
    restaurant_id     UUID,
    restaurant_name   TEXT,
    city_name         TEXT,
    sentiment         TEXT,
    derived_score     NUMERIC,
    photo_url         TEXT,
    rated_at          TIMESTAMPTZ
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
    WHERE pr.user_id = v_user_id
      AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$$;


-- ============================================
-- get_my_dish_rankings
-- Updated: orders by rank_position, returns sentiment + derived_score.
-- Must DROP first (return type changes).
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_dish_rankings(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_my_dish_rankings(
    p_dish_type_id UUID,
    p_user_id      UUID DEFAULT NULL
) RETURNS TABLE (
    rank            BIGINT,
    rating_id       UUID,
    restaurant_id   UUID,
    restaurant_name TEXT,
    city_name       TEXT,
    sentiment       TEXT,
    derived_score   NUMERIC,
    rank_position   INTEGER,
    photo_url       TEXT,
    rated_at        TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY pr.rank_position ASC NULLS LAST)::BIGINT AS rank,
        pr.id           AS rating_id,
        pr.restaurant_id,
        r.name          AS restaurant_name,
        c.name          AS city_name,
        pr.sentiment,
        pr.derived_score,
        pr.rank_position,
        pr.photo_url,
        pr.created_at   AS rated_at
    FROM public.personal_ratings pr
    JOIN public.restaurants r  ON r.id  = pr.restaurant_id
    LEFT JOIN public.cities c  ON c.id  = r.city_id
    WHERE pr.user_id      = v_user_id
      AND pr.dish_type_id = p_dish_type_id
    ORDER BY pr.rank_position ASC NULLS LAST;
END;
$$;


-- ============================================
-- get_user_stats
-- Fix: skip_rate now uses result = 'skipped' (comparisons.skipped column removed).
-- ============================================
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
                FROM public.personal_ratings
                WHERE user_id = v_user_id
                GROUP BY dish_type_id
            ) r
            JOIN public.dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',  (
            SELECT COUNT(DISTINCT r.city_id)
            FROM public.personal_ratings pr
            JOIN public.restaurants r ON r.id = pr.restaurant_id
            WHERE pr.user_id = v_user_id
        ),
        'member_since',     p.created_at,
        'skip_rate',        (
            SELECT ROUND(
                COUNT(*) FILTER (WHERE result = 'skipped')::DECIMAL
                / NULLIF(COUNT(*), 0),
                3
            )
            FROM public.comparisons
            WHERE user_id = v_user_id
        )
    )
    INTO v_result
    FROM public.profiles p
    WHERE p.id = v_user_id;

    RETURN v_result;
END;
$$;


-- ============================================
-- get_discover_heroes
-- Updated: p_min_battles → p_min_ratings; returns bayesian_score + confidence_tier.
-- ============================================
DROP FUNCTION IF EXISTS public.get_discover_heroes(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER);

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
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name  AS restaurant_name,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        n.name  AS neighborhood_name,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r  ON r.id  = gds.restaurant_id
    LEFT JOIN public.cities   c  ON c.id  = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
      AND (p_city_name IS NULL OR c.name ILIKE p_city_name)
      AND (
          v_user_point IS NULL OR p_radius_meters IS NULL
          OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
      )
      AND (
          v_user_id IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          )
      )
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$$;


-- ============================================
-- get_discover_rising_stars
-- Updated: p_max_battles → p_max_ratings; returns bayesian_score + confidence_tier.
-- ============================================
DROP FUNCTION IF EXISTS public.get_discover_rising_stars(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, NUMERIC, INTEGER, INTEGER);

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
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name  AS restaurant_name,
        gds.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        gds.city_id,
        gds.neighborhood_id,
        n.name  AS neighborhood_name,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        gds.featured_photo_url
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
      AND (
          v_user_point IS NULL OR p_radius_meters IS NULL
          OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
      )
      AND (
          v_user_id IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          )
      )
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$$;
