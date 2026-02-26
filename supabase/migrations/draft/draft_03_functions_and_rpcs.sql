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
-- CORE: recalculate_derived_scores
-- Recomputes derived_score for all ratings in each sentiment zone
-- using bucket-anchored interpolation.
-- Score = ceiling − ((rank−1)/(n−1)) × (ceiling−floor); single item = midpoint
-- ============================================================
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

-- ============================================================
-- CORE: compute_community_score
-- Bayesian-smoothed leaderboard score for a restaurant/dish pair.
-- Formula: bayesian = (Σsᵢ + C·m) / (n + C), C=5, m=city mean for dish
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_community_score(
    p_restaurant_id UUID,
    p_dish_type_id  UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    C                      CONSTANT NUMERIC := 5;
    v_total_ratings        INTEGER;
    v_weighted_score_sum   NUMERIC;
    v_weighted_rating_cnt  NUMERIC;
    v_raw_weighted_avg     NUMERIC;
    v_global_mean          NUMERIC;
    v_bayesian_score       NUMERIC;
    v_confidence_tier      TEXT;
BEGIN
    SELECT COUNT(*), SUM(derived_score), SUM(1.0)
    INTO v_total_ratings, v_weighted_score_sum, v_weighted_rating_cnt
    FROM public.personal_ratings
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND derived_score IS NOT NULL;

    IF COALESCE(v_total_ratings, 0) = 0 THEN RETURN; END IF;

    v_raw_weighted_avg := v_weighted_score_sum / NULLIF(v_weighted_rating_cnt, 0);

    -- City mean for same dish type (excluding this restaurant)
    SELECT COALESCE(AVG(gds2.raw_weighted_avg), 5.0)
    INTO v_global_mean
    FROM public.global_dish_scores gds1
    JOIN public.global_dish_scores gds2
      ON gds2.city_id       = gds1.city_id
     AND gds2.dish_type_id  = p_dish_type_id
     AND gds2.restaurant_id != p_restaurant_id
    WHERE gds1.restaurant_id = p_restaurant_id
      AND gds1.dish_type_id  = p_dish_type_id;

    IF v_global_mean IS NULL THEN v_global_mean := 5.0; END IF;

    v_bayesian_score := ROUND(
        (v_weighted_score_sum + C * v_global_mean) / (v_weighted_rating_cnt + C),
        2
    );

    v_confidence_tier := CASE
        WHEN v_weighted_rating_cnt >= 25 THEN 'very_high'
        WHEN v_weighted_rating_cnt >= 10 THEN 'high'
        WHEN v_weighted_rating_cnt >= C  THEN 'medium'
        ELSE                                  'low'
    END;

    UPDATE public.global_dish_scores
    SET raw_weighted_avg      = v_raw_weighted_avg,
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

-- ============================================================
-- CORE: create_rating
-- Entry point: INSERT/UPDATE a rating + start binary insertion sort if needed.
-- Returns { rating_id, has_battle } or { rating_id, has_battle, battle_id,
--          step, max_steps, skips_remaining, opponent }
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_rating(
    p_restaurant_id       UUID,
    p_dish_type_id        UUID,
    p_sentiment           TEXT,
    p_photo_url           TEXT,
    p_photo_storage_path  TEXT    DEFAULT NULL,
    p_variation_id        UUID    DEFAULT NULL,
    p_notes               TEXT    DEFAULT NULL,
    p_location_verified   BOOLEAN DEFAULT FALSE,
    p_taste_tag_ids       UUID[]  DEFAULT NULL
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
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF p_sentiment NOT IN ('liked','okay','disliked') THEN
        RAISE EXCEPTION 'Invalid sentiment: %', p_sentiment;
    END IF;

    SELECT city_id, neighborhood_id INTO v_city_id, v_neighborhood_id
    FROM public.restaurants WHERE id = p_restaurant_id;

    SELECT id INTO v_new_rating_id
    FROM public.personal_ratings
    WHERE user_id = v_user_id AND restaurant_id = p_restaurant_id AND dish_type_id = p_dish_type_id;

    v_is_new_insert := (v_new_rating_id IS NULL);

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

    IF p_taste_tag_ids IS NOT NULL AND array_length(p_taste_tag_ids, 1) > 0 THEN
        DELETE FROM public.personal_rating_tags WHERE rating_id = v_new_rating_id;
        INSERT INTO public.personal_rating_tags (rating_id, tag_id)
        SELECT v_new_rating_id, unnest(p_taste_tag_ids) ON CONFLICT DO NOTHING;
    END IF;

    IF v_is_new_insert THEN
        UPDATE public.profiles SET total_ratings = total_ratings + 1 WHERE id = v_user_id;
    END IF;

    INSERT INTO public.global_dish_scores (restaurant_id, dish_type_id, city_id, neighborhood_id, total_ratings)
    VALUES (p_restaurant_id, p_dish_type_id, v_city_id, v_neighborhood_id, 0)
    ON CONFLICT (restaurant_id, dish_type_id) DO NOTHING;

    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
      AND sentiment = p_sentiment AND rank_position IS NOT NULL AND id != v_new_rating_id;

    IF v_zone_size = 0 THEN
        -- No existing zone items: place immediately at midpoint
        SELECT COUNT(*) INTO v_count_liked
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
          AND sentiment = 'liked' AND rank_position IS NOT NULL AND id != v_new_rating_id;

        SELECT COUNT(*) INTO v_count_okay
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
          AND sentiment = 'okay' AND rank_position IS NOT NULL AND id != v_new_rating_id;

        v_insert_position := CASE p_sentiment
            WHEN 'liked'    THEN 1
            WHEN 'okay'     THEN v_count_liked + 1
            ELSE                 v_count_liked + v_count_okay + 1
        END;

        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
          AND rank_position >= v_insert_position AND id != v_new_rating_id AND rank_position IS NOT NULL;

        CASE p_sentiment
            WHEN 'liked'    THEN v_floor := 7.0; v_ceiling := 10.0;
            WHEN 'okay'     THEN v_floor := 4.0; v_ceiling := 6.9;
            ELSE                 v_floor := 1.0; v_ceiling := 3.9;
        END CASE;

        UPDATE public.personal_ratings
        SET rank_position = v_insert_position,
            derived_score = ROUND((v_ceiling + v_floor) / 2.0, 2)
        WHERE id = v_new_rating_id;

        PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
        PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);

        RETURN jsonb_build_object('rating_id', v_new_rating_id, 'has_battle', false);

    ELSE
        -- Zone has items: start binary insertion sort
        v_max_battles := floor(log(2, v_zone_size::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
          AND sentiment = p_sentiment AND rank_position IS NOT NULL AND id != v_new_rating_id;

        v_mid := floor((v_zone_size - 1)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_opponent_id, v_opponent_restaurant, v_opponent_photo, v_opponent_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id = v_user_id AND pr.dish_type_id = p_dish_type_id
          AND pr.rank_position = v_zone_start + v_mid AND pr.id != v_new_rating_id;

        IF v_opponent_id IS NULL THEN
            RAISE WARNING 'create_rating: opponent not found at rank %. Placing without battle.', v_zone_start + v_mid;

            SELECT MIN(rank_position) INTO v_insert_position
            FROM public.personal_ratings
            WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
              AND sentiment = p_sentiment AND rank_position IS NOT NULL AND id != v_new_rating_id;

            UPDATE public.personal_ratings
            SET rank_position = COALESCE(v_insert_position, 1),
                derived_score = CASE p_sentiment WHEN 'liked' THEN 8.5 WHEN 'okay' THEN 5.5 ELSE 2.5 END
            WHERE id = v_new_rating_id;

            PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
            PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);
            RETURN jsonb_build_object('rating_id', v_new_rating_id, 'has_battle', false);
        END IF;

        INSERT INTO public.comparisons (user_id, dish_type_id, new_rating_id, opponent_rating_id, low_bound, high_bound, step_number)
        VALUES (v_user_id, p_dish_type_id, v_new_rating_id, v_opponent_id, 0, v_zone_size - 1, 1)
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

-- ============================================================
-- CORE: process_battle
-- Processes a vote in the binary insertion sort sequence.
-- Returns { done: true, rank_position, derived_score }
--      or { done: false, next_battle_id, step, max_steps, skips_remaining, opponent }
-- ============================================================
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

    SELECT * INTO v_new_rating FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    v_mid := floor((v_battle.low_bound + v_battle.high_bound)::NUMERIC / 2)::INTEGER;

    IF p_winner_rating_id = v_battle.new_rating_id THEN
        v_new_low  := v_battle.low_bound;
        v_new_high := v_mid;
        UPDATE public.comparisons SET result = 'new_wins' WHERE id = p_battle_id;
    ELSE
        v_new_low  := v_mid + 1;
        v_new_high := v_battle.high_bound;
        UPDATE public.comparisons SET result = 'opponent_wins' WHERE id = p_battle_id;
    END IF;

    UPDATE public.profiles SET total_battles = total_battles + 1 WHERE id = v_user_id;

    IF v_new_low >= v_new_high THEN
        -- Converged: insert at final position
        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
          AND sentiment = v_new_rating.sentiment AND rank_position IS NOT NULL AND id != v_battle.new_rating_id;

        v_insert_rank := v_zone_start + v_new_low;

        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank AND id != v_battle.new_rating_id AND rank_position IS NOT NULL;

        UPDATE public.personal_ratings SET rank_position = v_insert_rank WHERE id = v_battle.new_rating_id;

        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object('done', true, 'rank_position', v_insert_rank, 'derived_score', v_final_score);

    ELSE
        -- Continue: find next opponent
        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
          AND sentiment = v_new_rating.sentiment AND rank_position IS NOT NULL AND id != v_battle.new_rating_id;

        v_next_rank := v_zone_start + floor((v_new_low + v_new_high)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_next_id, v_next_restaurant, v_next_photo, v_next_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id = v_user_id AND pr.dish_type_id = v_battle.dish_type_id
          AND pr.rank_position = v_next_rank AND pr.id != v_battle.new_rating_id;

        SELECT COUNT(*) INTO v_zone_size
        FROM public.personal_ratings
        WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
          AND sentiment = v_new_rating.sentiment AND rank_position IS NOT NULL AND id != v_battle.new_rating_id;

        v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        SELECT COUNT(*) INTO v_existing_skips
        FROM public.comparisons WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

        v_skips_remaining := v_max_skips - v_existing_skips;

        INSERT INTO public.comparisons (user_id, dish_type_id, new_rating_id, opponent_rating_id, low_bound, high_bound, step_number)
        VALUES (v_user_id, v_battle.dish_type_id, v_battle.new_rating_id, v_next_id, v_new_low, v_new_high, v_battle.step_number + 1)
        RETURNING id INTO v_next_battle_id;

        RETURN jsonb_build_object(
            'done', false,
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

-- ============================================================
-- CORE: skip_battle
-- ============================================================
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

    SELECT * INTO v_new_rating FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
      AND sentiment = v_new_rating.sentiment AND rank_position IS NOT NULL AND id != v_battle.new_rating_id;

    v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
    v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

    SELECT COUNT(*) INTO v_existing_skips
    FROM public.comparisons WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

    IF v_existing_skips >= v_max_skips THEN RAISE EXCEPTION 'No skips remaining for this battle sequence'; END IF;

    UPDATE public.comparisons SET result = 'skipped', skip_reason = p_skip_reason WHERE id = p_battle_id;

    SELECT MIN(rank_position) INTO v_zone_start
    FROM public.personal_ratings
    WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
      AND sentiment = v_new_rating.sentiment AND rank_position IS NOT NULL AND id != v_battle.new_rating_id;

    IF v_battle.low_bound >= v_battle.high_bound THEN
        -- Single-item range: force completion
        v_insert_rank := v_zone_start + v_battle.low_bound;

        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id = v_user_id AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank AND id != v_battle.new_rating_id AND rank_position IS NOT NULL;

        UPDATE public.personal_ratings SET rank_position = v_insert_rank WHERE id = v_battle.new_rating_id;

        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object('done', true, 'rank_position', v_insert_rank, 'derived_score', v_final_score);
    END IF;

    -- Multi-item range: try a different opponent (mid ± 1)
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
    WHERE pr.user_id = v_user_id AND pr.dish_type_id = v_battle.dish_type_id
      AND pr.rank_position = v_next_rank AND pr.id != v_battle.new_rating_id;

    INSERT INTO public.comparisons (user_id, dish_type_id, new_rating_id, opponent_rating_id, low_bound, high_bound, step_number)
    VALUES (v_user_id, v_battle.dish_type_id, v_battle.new_rating_id, v_next_id, v_battle.low_bound, v_battle.high_bound, v_battle.step_number + 1)
    RETURNING id INTO v_next_battle_id;

    RETURN jsonb_build_object(
        'done', false,
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

-- ============================================================
-- LEADERBOARD: get_leaderboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_city_id         UUID,
    p_dish_type_id    UUID,
    p_neighborhood_id UUID    DEFAULT NULL,
    p_limit           INTEGER DEFAULT 10,
    p_min_ratings     INTEGER DEFAULT 2
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
            ORDER BY gds.bayesian_score DESC, gds.raw_weighted_avg DESC,
                     gds.total_ratings DESC, gds.created_at ASC
        )::BIGINT AS rank,
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
    ORDER BY gds.bayesian_score DESC, gds.raw_weighted_avg DESC, gds.total_ratings DESC
    LIMIT p_limit;
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
-- PERSONAL: get_my_dish_rankings
-- Returns all of a user's ratings for a dish type, ordered by rank.
-- ============================================================
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
    WHERE pr.user_id = v_user_id AND pr.dish_type_id = p_dish_type_id
    ORDER BY pr.rank_position ASC NULLS LAST;
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

-- ============================================================
-- ADMIN: recalculate_global_scores (maintenance utility)
-- Iterates all global_dish_scores and re-runs compute_community_score.
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_global_scores(
    p_city_id      UUID DEFAULT NULL,
    p_dish_type_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_record record;
    v_count  INTEGER := 0;
BEGIN
    FOR v_record IN
        SELECT restaurant_id, dish_type_id FROM public.global_dish_scores
        WHERE (p_city_id IS NULL OR city_id = p_city_id)
          AND (p_dish_type_id IS NULL OR dish_type_id = p_dish_type_id)
    LOOP
        PERFORM public.compute_community_score(v_record.restaurant_id, v_record.dish_type_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'records_updated', v_count,
        'city_filter', p_city_id,
        'dish_type_filter', p_dish_type_id
    );
END;
$$;
