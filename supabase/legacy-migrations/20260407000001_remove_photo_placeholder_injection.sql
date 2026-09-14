-- ============================================================
-- Remove placeholder photo injection from personal_ratings.
--
-- Problem: create_rating was injecting dish_types.placeholder_photo_url
-- into personal_ratings.photo_url when no photo was supplied. This caused:
--   1. Duplicate placeholder images in community photo galleries.
--   2. No-photo ratings incorrectly receiving the 1.25x photo weight bonus
--      in the Bayesian leaderboard calculation.
--   3. Placeholder URLs set as featured_photo_url in global_dish_scores.
--
-- Fix: Store NULL for photo_url when no photo is provided. RPCs that
-- display the photo (personal rankings, best ever, battle opponents)
-- now resolve the placeholder at read time via COALESCE, so it never
-- persists in the database.
-- ============================================================

-- ============================================================
-- 1. DATA CLEANUP — fix existing rows that have placeholder URLs
-- ============================================================

-- 1a. Null out photo_url on personal_ratings where the stored value
--     matches the dish type's placeholder (injected by the old create_rating).
UPDATE public.personal_ratings pr
SET photo_url = NULL
FROM public.dish_types dt
WHERE pr.dish_type_id = dt.id
  AND dt.placeholder_photo_url IS NOT NULL
  AND pr.photo_url = dt.placeholder_photo_url;

-- 1b. Remove placeholder URLs from restaurant_dishes.photos arrays.
UPDATE public.restaurant_dishes rd
SET photos = ARRAY(
    SELECT url
    FROM UNNEST(rd.photos) AS url
    WHERE url NOT IN (
        SELECT placeholder_photo_url
        FROM public.dish_types
        WHERE placeholder_photo_url IS NOT NULL
    )
)
WHERE EXISTS (
    SELECT 1
    FROM UNNEST(rd.photos) AS url
    WHERE url IN (
        SELECT placeholder_photo_url
        FROM public.dish_types
        WHERE placeholder_photo_url IS NOT NULL
    )
);

-- 1c. Clear featured_photo_url on global_dish_scores where it was set
--     to a placeholder. The next real rating submission will recalculate.
UPDATE public.global_dish_scores gds
SET featured_photo_url = NULL,
    featured_rating_id = NULL
FROM public.dish_types dt
WHERE gds.dish_type_id = dt.id
  AND dt.placeholder_photo_url IS NOT NULL
  AND gds.featured_photo_url = dt.placeholder_photo_url;

-- ============================================================
-- 2. create_rating — remove placeholder injection
--    Keep p_photo_url DEFAULT NULL (photos are optional).
--    Just store p_photo_url directly; NULL stays NULL.
--    Battle opponent photo_url now falls back to placeholder at read time.
-- ============================================================
DROP FUNCTION IF EXISTS public.create_rating(UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, UUID[]);

CREATE OR REPLACE FUNCTION public.create_rating(
        p_restaurant_id UUID,
        p_dish_type_id UUID,
        p_sentiment TEXT,
        p_photo_url TEXT DEFAULT NULL,
        p_photo_storage_path TEXT DEFAULT NULL,
        p_variation_id UUID DEFAULT NULL,
        p_notes TEXT DEFAULT NULL,
        p_taste_tag_ids UUID [] DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_rating_id UUID;
    v_initial_elo NUMERIC;
    v_zone_min NUMERIC;
    v_zone_max NUMERIC;
    v_is_re_rating BOOLEAN := false;
    v_candidates UUID [];
    v_candidate_count INTEGER;
    v_battle_id UUID;
    v_first_opponent JSONB := NULL;
    v_mid_idx INTEGER;
    v_opponent_rating RECORD;
    v_new_badges JSONB := '[]'::JSONB;
BEGIN
-- -------------------------------------------------------
-- 1. Resolve initial Elo from sentiment
-- -------------------------------------------------------
SELECT value INTO v_initial_elo
FROM app_constants
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
-- 3. Upsert the personal rating (photo_url stored as-is; NULL when no photo)
-- -------------------------------------------------------
SELECT id INTO v_rating_id
FROM personal_ratings
WHERE user_id = v_user_id
    AND restaurant_id = p_restaurant_id
    AND dish_type_id = p_dish_type_id;

IF v_rating_id IS NOT NULL THEN
    v_is_re_rating := true;
    UPDATE battle_sessions
    SET status = 'abandoned', updated_at = now()
    WHERE rating_id = v_rating_id AND status = 'active';

    UPDATE personal_ratings
    SET sentiment = p_sentiment,
        elo_score = v_initial_elo,
        comparison_count = 0,
        battle_status = 'pending',
        photo_url = p_photo_url,
        photo_storage_path = COALESCE(p_photo_storage_path, photo_storage_path),
        variation_id = p_variation_id,
        notes = p_notes,
        updated_at = now()
    WHERE id = v_rating_id;

    DELETE FROM personal_rating_tags WHERE rating_id = v_rating_id;
ELSE
    INSERT INTO personal_ratings (
            user_id, restaurant_id, dish_type_id,
            sentiment, elo_score, comparison_count, battle_status,
            photo_url, photo_storage_path, variation_id, notes
        )
    VALUES (
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
-- -------------------------------------------------------
SELECT ARRAY_AGG(id ORDER BY elo_score DESC) INTO v_candidates
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
    UPDATE personal_ratings SET battle_status = 'completed' WHERE id = v_rating_id;
    PERFORM _update_profile_stats(v_user_id);
    PERFORM _update_global_dish_score(p_restaurant_id, p_dish_type_id);
    v_new_badges := public.evaluate_badges(v_user_id);
    RETURN jsonb_build_object(
        'rating_id', v_rating_id,
        'battle_id', NULL,
        'opponent', NULL,
        'battle_complete', true,
        'is_re_rating', v_is_re_rating,
        'elo_score', v_initial_elo,
        'derived_score', ROUND(((v_initial_elo - 1000) / 1000.0) * 10.0, 1),
        'new_badges', v_new_badges
    );
END IF;
-- -------------------------------------------------------
-- 7. Create battle session
-- -------------------------------------------------------
UPDATE personal_ratings SET battle_status = 'in_progress' WHERE id = v_rating_id;

INSERT INTO battle_sessions (
        user_id, rating_id, dish_type_id,
        candidate_ids, low_idx, high_idx, current_step
    )
VALUES (
        v_user_id, v_rating_id, p_dish_type_id,
        v_candidates, 0, v_candidate_count - 1, 1
    )
RETURNING id INTO v_battle_id;
-- -------------------------------------------------------
-- 8. Return first opponent (midpoint)
--    Resolve placeholder at read time so photo_url is never null in the UI.
-- -------------------------------------------------------
v_mid_idx := (0 + (v_candidate_count - 1)) / 2;

SELECT id, restaurant_id, elo_score,
    ROUND(((LEAST(GREATEST(elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score
    INTO v_opponent_rating
FROM personal_ratings
WHERE id = v_candidates[v_mid_idx + 1];

SELECT jsonb_build_object(
        'rating_id', v_opponent_rating.id,
        'restaurant_id', v_opponent_rating.restaurant_id,
        'restaurant_name', r.name,
        'elo_score', v_opponent_rating.elo_score,
        'derived_score', v_opponent_rating.display_score,
        'photo_url', COALESCE(pr.photo_url, dt.placeholder_photo_url)
    ) INTO v_first_opponent
FROM restaurants r
    JOIN personal_ratings pr ON pr.id = v_opponent_rating.id
    JOIN dish_types dt ON dt.id = pr.dish_type_id
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
-- 3. submit_comparison — resolve placeholder for next opponent
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_comparison(
        p_battle_id UUID,
        p_result TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
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
$$;

-- ============================================================
-- 4. get_personal_rankings — return placeholder when photo_url is NULL
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_personal_rankings(
        p_dish_type_id UUID,
        p_limit INTEGER DEFAULT 50,
        p_offset INTEGER DEFAULT 0
    ) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_results JSONB;
BEGIN
SELECT jsonb_agg(row_data ORDER BY rank_num) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',             ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC),
                'rating_id',        pr.id,
                'restaurant_id',    r.id,
                'restaurant_name',  r.name,
                'elo_score',        pr.elo_score,
                'derived_score',    pr.derived_score,
                'sentiment',        pr.sentiment,
                'photo_url',        COALESCE(pr.photo_url, dt.placeholder_photo_url),
                'comparison_count', pr.comparison_count,
                'notes',            pr.notes,
                'rated_at',         pr.updated_at,
                'variation_name',   dtv.name,
                'neighborhood_name', n.name,
                'city_name',        c.name
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC) AS rank_num
        FROM personal_ratings pr
            JOIN restaurants r ON r.id = pr.restaurant_id
            JOIN dish_types dt ON dt.id = pr.dish_type_id
            LEFT JOIN dish_type_variations dtv ON dtv.id = pr.variation_id
            LEFT JOIN neighborhoods n ON n.id = r.neighborhood_id
            LEFT JOIN cities c ON c.id = r.city_id
        WHERE pr.user_id = v_user_id
            AND pr.dish_type_id = p_dish_type_id
            AND pr.battle_status = 'completed'
        ORDER BY pr.elo_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- ============================================================
-- 5. get_my_best_ever — return placeholder when photo_url is NULL
--    (already JOINs dish_types; just change the photo_url expression)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_my_best_ever(UUID);

CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        dish_type_icon TEXT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        neighborhood_name TEXT,
        variation_name TEXT,
        sentiment TEXT,
        derived_score NUMERIC,
        photo_url TEXT,
        rated_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;
    RETURN QUERY
    SELECT DISTINCT ON (pr.dish_type_id)
        pr.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        dt.icon AS dish_type_icon,
        pr.id AS rating_id,
        pr.restaurant_id,
        r.name AS restaurant_name,
        c.name AS city_name,
        n.name AS neighborhood_name,
        dtv.name AS variation_name,
        pr.sentiment,
        pr.derived_score,
        COALESCE(pr.photo_url, dt.placeholder_photo_url) AS photo_url,
        pr.created_at AS rated_at
    FROM public.personal_ratings pr
        JOIN public.dish_types dt ON dt.id = pr.dish_type_id
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        LEFT JOIN public.cities c ON c.id = r.city_id
        LEFT JOIN public.neighborhoods n ON n.id = r.neighborhood_id
        LEFT JOIN public.dish_type_variations dtv ON dtv.id = pr.variation_id
    WHERE pr.user_id = v_user_id
        AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$$;

-- ============================================================
-- 6. auto_populate_restaurant_dish trigger — skip NULL photo_urls
--    Previously ARRAY[NULL] was being appended when no photo was provided.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.restaurant_dishes (
            restaurant_id, dish_type_id, variation_id,
            source, first_rated_at, total_ratings, photos
        )
    VALUES (
            NEW.restaurant_id, NEW.dish_type_id, NEW.variation_id,
            'rating', NOW(), 1,
            CASE WHEN NEW.photo_url IS NOT NULL THEN ARRAY[NEW.photo_url] ELSE ARRAY[]::TEXT[] END
        )
    ON CONFLICT (restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET
        total_ratings = public.restaurant_dishes.total_ratings + 1,
        photos = CASE
            WHEN NEW.photo_url IS NOT NULL
            THEN array_append(public.restaurant_dishes.photos, NEW.photo_url)
            ELSE public.restaurant_dishes.photos
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$;
