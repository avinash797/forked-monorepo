-- Make photo_url optional on personal_ratings.
-- Ratings with photos receive a 1.25x weight bonus in the Bayesian leaderboard calculation.

ALTER TABLE public.personal_ratings
    ALTER COLUMN photo_url DROP NOT NULL;

ALTER TABLE public.dish_types
    ADD placeholder_photo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('dish_placeholders', 'dish_placeholders', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "dish_placeholders_bucket_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'dish_placeholders');

-- Update _update_global_dish_score to apply photo weight bonus (1.25x for rated dishes with photos)
CREATE OR REPLACE FUNCTION public._update_global_dish_score(
        p_restaurant_id UUID,
        p_dish_type_id UUID
    ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_city_id UUID;
v_neighborhood_id UUID;
v_bayesian_c NUMERIC;
v_global_mean NUMERIC;
v_weighted_sum NUMERIC;
v_weighted_count NUMERIC;
v_total_ratings INTEGER;
v_bayesian_score NUMERIC;
v_raw_avg NUMERIC;
v_confidence TEXT;
v_featured_photo_url TEXT;
v_featured_rating_id UUID;
BEGIN -- Get restaurant geography
SELECT city_id,
    neighborhood_id INTO v_city_id,
    v_neighborhood_id
FROM restaurants
WHERE id = p_restaurant_id;
-- Load Bayesian constant
SELECT value INTO v_bayesian_c
FROM app_constants
WHERE key = 'BAYESIAN_C';
-- Calculate city-level global mean for this dish type
SELECT COALESCE(AVG(pr.derived_score), 5.0) INTO v_global_mean
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed'
    AND r.city_id = v_city_id;
-- Calculate weighted scores for this restaurant+dish
-- Ratings with a photo carry 1.25x weight vs. ratings without a photo
SELECT COALESCE(SUM(pr.derived_score * p.credibility_score * CASE WHEN pr.photo_url IS NOT NULL THEN 1.25 ELSE 1.0 END), 0),
    COALESCE(SUM(p.credibility_score * CASE WHEN pr.photo_url IS NOT NULL THEN 1.25 ELSE 1.0 END), 0),
    COUNT(*),
    COALESCE(AVG(pr.derived_score), 0) INTO v_weighted_sum,
    v_weighted_count,
    v_total_ratings,
    v_raw_avg
FROM personal_ratings pr
    JOIN profiles p ON p.id = pr.user_id
WHERE pr.restaurant_id = p_restaurant_id
    AND pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed';
-- Bayesian average
v_bayesian_score := (v_bayesian_c * v_global_mean + v_weighted_sum) / (v_bayesian_c + v_weighted_count);
-- Confidence tier (based on raw rating count)
v_confidence := CASE
    WHEN v_total_ratings < 5 THEN 'low'
    WHEN v_total_ratings < 10 THEN 'medium'
    WHEN v_total_ratings < 25 THEN 'high'
    ELSE 'very_high'
END;
-- Featured photo: pick highest-rated user's photo
SELECT pr.photo_url,
    pr.id INTO v_featured_photo_url,
    v_featured_rating_id
FROM personal_ratings pr
WHERE pr.restaurant_id = p_restaurant_id
    AND pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed'
    AND pr.photo_url IS NOT NULL
ORDER BY pr.elo_score DESC
LIMIT 1;
-- Upsert global score
INSERT INTO global_dish_scores (
        restaurant_id,
        dish_type_id,
        city_id,
        neighborhood_id,
        raw_weighted_avg,
        weighted_score_sum,
        weighted_rating_count,
        total_ratings,
        bayesian_score,
        confidence_tier,
        featured_photo_url,
        featured_rating_id,
        updated_at
    )
VALUES (
        p_restaurant_id,
        p_dish_type_id,
        v_city_id,
        v_neighborhood_id,
        v_raw_avg,
        v_weighted_sum,
        v_weighted_count,
        v_total_ratings,
        ROUND(v_bayesian_score, 2),
        v_confidence,
        v_featured_photo_url,
        v_featured_rating_id,
        now()
    ) ON CONFLICT (restaurant_id, dish_type_id) DO
UPDATE
SET raw_weighted_avg = EXCLUDED.raw_weighted_avg,
    weighted_score_sum = EXCLUDED.weighted_score_sum,
    weighted_rating_count = EXCLUDED.weighted_rating_count,
    total_ratings = EXCLUDED.total_ratings,
    bayesian_score = EXCLUDED.bayesian_score,
    confidence_tier = EXCLUDED.confidence_tier,
    featured_photo_url = EXCLUDED.featured_photo_url,
    featured_rating_id = EXCLUDED.featured_rating_id,
    updated_at = now();
END;
$$;



-- ============================================================
-- Update create_rating to use placeholder photos when no photo is provided
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
DECLARE v_user_id UUID := auth.uid();
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
v_dish_type_placeholder_url TEXT;
v_new_badges JSONB := '[]'::JSONB;
BEGIN -- -------------------------------------------------------
-- 1. Resolve initial Elo from sentiment
-- -------------------------------------------------------
SELECT value INTO v_initial_elo
FROM app_constants
WHERE key = 'ELO_INITIAL_' || UPPER(
        CASE
            p_sentiment
            WHEN 'liked' THEN 'LIKED'
            WHEN 'okay' THEN 'OKAY'
            WHEN 'disliked' THEN 'DISLIKED'
        END
    );
IF v_initial_elo IS NULL THEN RAISE EXCEPTION 'Invalid sentiment: %',
p_sentiment;
END IF;
-- -------------------------------------------------------
-- 2. Resolve search zone boundaries
-- -------------------------------------------------------
CASE
    p_sentiment
    WHEN 'liked' THEN
    SELECT value INTO v_zone_min
    FROM app_constants
    WHERE key = 'ZONE_LIKED_MIN';
SELECT value INTO v_zone_max
FROM app_constants
WHERE key = 'ELO_MAX';
WHEN 'okay' THEN
SELECT value INTO v_zone_min
FROM app_constants
WHERE key = 'ZONE_OKAY_MIN';
SELECT value INTO v_zone_max
FROM app_constants
WHERE key = 'ZONE_OKAY_MAX';
WHEN 'disliked' THEN
SELECT value INTO v_zone_min
FROM app_constants
WHERE key = 'ELO_MIN';
SELECT value INTO v_zone_max
FROM app_constants
WHERE key = 'ZONE_DISLIKED_MAX';
END CASE
;
-- -------------------------------------------------------
-- 3. Upsert the personal rating
-- -------------------------------------------------------
SELECT placeholder_photo_url INTO v_dish_type_placeholder_url
FROM dish_types
WHERE id = p_dish_type_id;

SELECT id INTO v_rating_id
FROM personal_ratings
WHERE user_id = v_user_id
    AND restaurant_id = p_restaurant_id
    AND dish_type_id = p_dish_type_id;
IF v_rating_id IS NOT NULL THEN -- Re-rating: reset Elo and comparison count
v_is_re_rating := true;
-- Abandon any active battle for this rating
UPDATE battle_sessions
SET status = 'abandoned',
    updated_at = now()
WHERE rating_id = v_rating_id
    AND status = 'active';
UPDATE personal_ratings
SET sentiment = p_sentiment,
    elo_score = v_initial_elo,
    comparison_count = 0,
    battle_status = 'pending',
    photo_url = COALESCE(p_photo_url, v_dish_type_placeholder_url),
    photo_storage_path = COALESCE(p_photo_storage_path, photo_storage_path),
    variation_id = p_variation_id,
    notes = p_notes,
    updated_at = now()
WHERE id = v_rating_id;
-- Replace tags
DELETE FROM personal_rating_tags
WHERE rating_id = v_rating_id;
ELSE
INSERT INTO personal_ratings (
        user_id,
        restaurant_id,
        dish_type_id,
        sentiment,
        elo_score,
        comparison_count,
        battle_status,
        photo_url,
        photo_storage_path,
        variation_id,
        notes
    )
VALUES (
        v_user_id,
        p_restaurant_id,
        p_dish_type_id,
        p_sentiment,
        v_initial_elo,
        0,
        'pending',
        COALESCE(p_photo_url, v_dish_type_placeholder_url),
        p_photo_storage_path,
        p_variation_id,
        p_notes
    )
RETURNING id INTO v_rating_id;
END IF;
-- -------------------------------------------------------
-- 4. Insert taste tags
-- -------------------------------------------------------
IF p_taste_tag_ids IS NOT NULL
AND array_length(p_taste_tag_ids, 1) > 0 THEN
INSERT INTO personal_rating_tags (rating_id, tag_id)
SELECT v_rating_id,
    unnest(p_taste_tag_ids) ON CONFLICT DO NOTHING;
END IF;
-- -------------------------------------------------------
-- 5. Build candidate list for binary search
--    (other ratings in same dish type within the Elo zone)
-- -------------------------------------------------------
SELECT ARRAY_AGG(
        id
        ORDER BY elo_score DESC
    ) INTO v_candidates
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
-- Evaluate and award any newly earned badges
v_new_badges := public.evaluate_badges(v_user_id);
RETURN jsonb_build_object(
    'rating_id',
    v_rating_id,
    'battle_id',
    NULL,
    'opponent',
    NULL,
    'battle_complete',
    true,
    'is_re_rating',
    v_is_re_rating,
    'elo_score',
    v_initial_elo,
    'derived_score',
    ROUND(((v_initial_elo - 1000) / 1000.0) * 10.0, 1),
    'new_badges',
    v_new_badges
);
END IF;
-- -------------------------------------------------------
-- 7. Create battle session
-- -------------------------------------------------------
UPDATE personal_ratings
SET battle_status = 'in_progress'
WHERE id = v_rating_id;
INSERT INTO battle_sessions (
        user_id,
        rating_id,
        dish_type_id,
        candidate_ids,
        low_idx,
        high_idx,
        current_step
    )
VALUES (
        v_user_id,
        v_rating_id,
        p_dish_type_id,
        v_candidates,
        0,
        v_candidate_count - 1,
        1
    )
RETURNING id INTO v_battle_id;
-- -------------------------------------------------------
-- 8. Return first opponent (midpoint)
-- -------------------------------------------------------
v_mid_idx := (0 + (v_candidate_count - 1)) / 2;
SELECT id,
    restaurant_id,
    elo_score,
    ROUND(
        (
            (LEAST(GREATEST(elo_score, 1000), 2000) - 1000) / 1000.0
        ) * 10.0,
        1
    ) AS display_score INTO v_opponent_rating
FROM personal_ratings
WHERE id = v_candidates [v_mid_idx + 1];
-- 1-indexed array access
SELECT jsonb_build_object(
        'rating_id',
        v_opponent_rating.id,
        'restaurant_id',
        v_opponent_rating.restaurant_id,
        'restaurant_name',
        r.name,
        'elo_score',
        v_opponent_rating.elo_score,
        'derived_score',
        v_opponent_rating.display_score,
        'photo_url',
        pr.photo_url
    ) INTO v_first_opponent
FROM restaurants r
    JOIN personal_ratings pr ON pr.id = v_opponent_rating.id
WHERE r.id = v_opponent_rating.restaurant_id;
RETURN jsonb_build_object(
    'rating_id',
    v_rating_id,
    'battle_id',
    v_battle_id,
    'opponent',
    v_first_opponent,
    'opponent_index',
    v_mid_idx,
    'battle_complete',
    false,
    'is_re_rating',
    v_is_re_rating,
    'total_candidates',
    v_candidate_count,
    'elo_score',
    v_initial_elo
);
END;
$$;