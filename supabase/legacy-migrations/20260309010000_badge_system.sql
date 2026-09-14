-- ============================================================
-- BADGE SYSTEM
-- Dynamic, server-driven badge/achievement system.
-- Badge definitions live in the DB; evaluation is server-side.
-- ============================================================
-- ============================================================
-- 1. Tables
-- ============================================================
CREATE TABLE public.badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'milestone' CHECK (
        category IN (
            'milestone',
            'dish_type',
            'explorer',
            'battle',
            'special'
        )
    ),
    dish_type_id UUID REFERENCES public.dish_types(id) ON DELETE
    SET NULL,
        threshold INTEGER,
        rule_type TEXT NOT NULL CHECK (
            rule_type IN (
                'total_ratings',
                'dish_type_count',
                'total_comparisons',
                'cities_count',
                'dish_types_count',
                'manual'
            )
        ),
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notified BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(user_id, badge_id)
);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges(badge_id);
-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
-- badge_definitions: public read for all authenticated + anon; admins can manage
CREATE POLICY "badge_definitions_public_read" ON public.badge_definitions FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "badge_definitions_admin_manage" ON public.badge_definitions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- user_badges: users read their own rows; inserts only via SECURITY DEFINER RPCs
CREATE POLICY "user_badges_own_read" ON public.user_badges FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- ============================================================
-- 3. Storage bucket for badge images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('badges', 'badges', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "badges_bucket_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'badges');
-- ============================================================
-- 4. Seed initial badge definitions
--    image_url defaults to '' — update after uploading images to
--    the 'badges' Supabase Storage bucket.
-- ============================================================
INSERT INTO public.badge_definitions (
        slug,
        name,
        description,
        category,
        rule_type,
        threshold,
        dish_type_id,
        is_active,
        sort_order
    )
VALUES (
        'first_bite',
        'First Bite',
        'Submitted your first dish rating',
        'milestone',
        'total_ratings',
        1,
        NULL,
        true,
        10
    ),
    (
        'getting_started',
        'Getting Started',
        'Rated 10 dishes',
        'milestone',
        'total_ratings',
        10,
        NULL,
        true,
        20
    ),
    (
        'foodie',
        'Foodie',
        'Rated 50 dishes',
        'milestone',
        'total_ratings',
        50,
        NULL,
        true,
        30
    ),
    (
        'connoisseur',
        'Connoisseur',
        'Rated 100 dishes',
        'milestone',
        'total_ratings',
        100,
        NULL,
        true,
        40
    ),
    (
        'battle_tested',
        'Battle Tested',
        'Completed 25 This vs That battles',
        'battle',
        'total_comparisons',
        25,
        NULL,
        true,
        50
    ),
    (
        'battle_master',
        'Battle Master',
        'Completed 100 This vs That battles',
        'battle',
        'total_comparisons',
        100,
        NULL,
        true,
        60
    ),
    (
        'explorer',
        'Explorer',
        'Rated dishes in 3 different cities',
        'explorer',
        'cities_count',
        3,
        NULL,
        false,
        70
    ),
    (
        'diverse_palate',
        'Diverse Palate',
        'Tried all 5 dish types',
        'explorer',
        'dish_types_count',
        5,
        NULL,
        true,
        80
    ) ON CONFLICT (slug) DO NOTHING;
-- One dish-type badge per active dish type (threshold = 10 ratings of that type)
INSERT INTO public.badge_definitions (
        slug,
        name,
        description,
        category,
        rule_type,
        threshold,
        dish_type_id,
        is_active,
        sort_order
    )
SELECT lower(
        regexp_replace(dt.name, '[^a-zA-Z0-9]', '_', 'g')
    ) || '_expert',
    dt.name || ' Expert',
    'Rated 10 ' || dt.name || ' dishes',
    'dish_type',
    'dish_type_count',
    10,
    dt.id,
    true,
    100 + (
        ROW_NUMBER() OVER (
            ORDER BY dt.name
        )
    )::INTEGER
FROM public.dish_types dt ON CONFLICT (slug) DO NOTHING;
-- ============================================================
-- 5. evaluate_badges(p_user_id UUID) → JSONB
--    Returns a JSONB array of newly awarded badges.
--    Called internally by create_rating and submit_comparison.
-- ============================================================
CREATE OR REPLACE FUNCTION public.evaluate_badges(p_user_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_badge RECORD;
v_count INTEGER;
v_earned BOOLEAN;
v_inserted UUID;
v_new_badges JSONB := '[]'::JSONB;
BEGIN FOR v_badge IN
SELECT bd.*
FROM badge_definitions bd
WHERE bd.is_active = true
    AND bd.rule_type != 'manual'
    AND NOT EXISTS (
        SELECT 1
        FROM user_badges ub
        WHERE ub.user_id = p_user_id
            AND ub.badge_id = bd.id
    )
ORDER BY bd.sort_order LOOP v_earned := false;
v_count := 0;
CASE
    v_badge.rule_type
    WHEN 'total_ratings' THEN
    SELECT COUNT(*) INTO v_count
    FROM personal_ratings
    WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_type_count' THEN
SELECT COUNT(*) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id
    AND dish_type_id = v_badge.dish_type_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'total_comparisons' THEN
SELECT COUNT(*) INTO v_count
FROM comparisons
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'cities_count' THEN
SELECT COUNT(DISTINCT r.city_id) INTO v_count
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_types_count' THEN
SELECT COUNT(DISTINCT dish_type_id) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
ELSE v_earned := false;
END CASE
;
IF v_earned THEN v_inserted := NULL;
INSERT INTO user_badges (user_id, badge_id)
VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING
RETURNING id INTO v_inserted;
IF v_inserted IS NOT NULL THEN v_new_badges := v_new_badges || jsonb_build_array(
    jsonb_build_object(
        'id',
        v_badge.id,
        'slug',
        v_badge.slug,
        'name',
        v_badge.name,
        'description',
        v_badge.description,
        'image_url',
        v_badge.image_url
    )
);
END IF;
END IF;
END LOOP;
RETURN v_new_badges;
END;
$$;
-- ============================================================
-- 6. get_user_badges(p_user_id UUID DEFAULT NULL) → JSONB
--    Returns all badge definitions with earned_at status.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id UUID DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
RETURN COALESCE(
    (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    bd.id,
                    'slug',
                    bd.slug,
                    'name',
                    bd.name,
                    'description',
                    bd.description,
                    'image_url',
                    bd.image_url,
                    'category',
                    bd.category,
                    'dish_type_id',
                    bd.dish_type_id,
                    'threshold',
                    bd.threshold,
                    'is_active',
                    bd.is_active,
                    'is_featured',
                    bd.is_featured,
                    'sort_order',
                    bd.sort_order,
                    'earned_at',
                    ub.earned_at,
                    'notified',
                    ub.notified
                )
                ORDER BY bd.is_featured DESC,
                    bd.sort_order,
                    bd.created_at
            )
        FROM badge_definitions bd
            LEFT JOIN user_badges ub ON ub.badge_id = bd.id
            AND ub.user_id = v_user_id
        WHERE bd.is_active = true
            OR ub.id IS NOT NULL
    ),
    '[]'::JSONB
);
END;
$$;
-- ============================================================
-- 7. award_badge_manual(p_user_id, p_badge_slug) → JSONB
--    Admin-only manual badge award.
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_badge_manual(p_user_id UUID, p_badge_slug TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_badge_id UUID;
BEGIN IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can award badges manually';
END IF;
SELECT id INTO v_badge_id
FROM badge_definitions
WHERE slug = p_badge_slug;
IF v_badge_id IS NULL THEN RAISE EXCEPTION 'Badge not found: %',
p_badge_slug;
END IF;
INSERT INTO user_badges (user_id, badge_id)
VALUES (p_user_id, v_badge_id) ON CONFLICT (user_id, badge_id) DO NOTHING;
RETURN jsonb_build_object(
    'success',
    true,
    'badge_slug',
    p_badge_slug,
    'user_id',
    p_user_id
);
END;
$$;
-- ============================================================
-- CORE: create_rating
-- Creates the rating record, sets up the battle session, and returns the first opponent.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_rating(
        p_restaurant_id UUID,
        p_dish_type_id UUID,
        p_sentiment TEXT,
        p_photo_url TEXT,
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
    photo_url = p_photo_url,
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
        p_photo_url,
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
-- ============================================================
-- CORE: submit_comparison 
-- Process One Battle Step.
-- Applies Elo update, records the comparison, advances binary search, returns next opponent or signals completion.
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_comparison(
        p_battle_id UUID,
        p_result TEXT -- 'new_wins', 'opponent_wins', 'skipped'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID := auth.uid();
v_session RECORD;
v_new_rating RECORD;
v_opponent_id UUID;
v_opponent_rating RECORD;
-- Elo calculation vars
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
-- Binary search vars
v_mid_idx INTEGER;
v_next_opponent JSONB := NULL;
v_battle_complete BOOLEAN := false;
v_next_opp_record RECORD;
-- Per-sentiment Elo clamp vars
v_new_clamp_min NUMERIC;
v_new_clamp_max NUMERIC;
v_opp_clamp_min NUMERIC;
v_opp_clamp_max NUMERIC;
-- For opponent global score update
v_opp_rest_id UUID;
-- For badge system
v_new_badges JSONB := '[]'::JSONB;
BEGIN -- -------------------------------------------------------
-- 1. Load battle session (verify ownership)
-- -------------------------------------------------------
SELECT * INTO v_session
FROM battle_sessions
WHERE id = p_battle_id
    AND user_id = v_user_id
    AND status = 'active';
IF v_session IS NULL THEN RAISE EXCEPTION 'No active battle session found';
END IF;
-- -------------------------------------------------------
-- 2. Load the new rating and current opponent
-- -------------------------------------------------------
SELECT id,
    elo_score,
    comparison_count,
    sentiment INTO v_new_rating
FROM personal_ratings
WHERE id = v_session.rating_id;
v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
v_opponent_id := v_session.candidate_ids [v_mid_idx + 1];
-- 1-indexed
SELECT id,
    elo_score,
    comparison_count,
    sentiment INTO v_opponent_rating
FROM personal_ratings
WHERE id = v_opponent_id;
-- -------------------------------------------------------
-- 3. Load constants
-- -------------------------------------------------------
SELECT value INTO v_k_max
FROM app_constants
WHERE key = 'K_MAX';
SELECT value INTO v_k_decay
FROM app_constants
WHERE key = 'K_DECAY';
SELECT value INTO v_elo_min
FROM app_constants
WHERE key = 'ELO_MIN';
SELECT value INTO v_elo_max
FROM app_constants
WHERE key = 'ELO_MAX';
-- Snapshot before
v_new_elo_before := v_new_rating.elo_score;
v_opp_elo_before := v_opponent_rating.elo_score;
-- -------------------------------------------------------
-- 4. Apply Elo update (skip if 'skipped')
-- -------------------------------------------------------
IF p_result IN ('new_wins', 'opponent_wins') THEN -- Dynamic K-factors
v_k_new := v_k_max / (1 + v_k_decay * v_new_rating.comparison_count);
v_k_opp := v_k_max / (
    1 + v_k_decay * v_opponent_rating.comparison_count
);
-- Expected outcomes
v_expected_new := 1.0 / (
    1.0 + power(
        10.0,
        (v_opp_elo_before - v_new_elo_before) / 400.0
    )
);
v_expected_opp := 1.0 - v_expected_new;
-- Actual scores
IF p_result = 'new_wins' THEN v_score_new := 1.0;
v_score_opp := 0.0;
ELSE v_score_new := 0.0;
v_score_opp := 1.0;
END IF;
-- Resolve per-sentiment Elo clamp boundaries
SELECT value INTO v_new_clamp_min
FROM app_constants
WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MIN';
SELECT value INTO v_new_clamp_max
FROM app_constants
WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MAX';
SELECT value INTO v_opp_clamp_min
FROM app_constants
WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MIN';
SELECT value INTO v_opp_clamp_max
FROM app_constants
WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MAX';
-- Compute new Elo (clamped to sentiment boundaries)
v_new_elo_after := LEAST(
    GREATEST(
        v_new_elo_before + v_k_new * (v_score_new - v_expected_new),
        v_new_clamp_min
    ),
    v_new_clamp_max
);
v_opp_elo_after := LEAST(
    GREATEST(
        v_opp_elo_before + v_k_opp * (v_score_opp - v_expected_opp),
        v_opp_clamp_min
    ),
    v_opp_clamp_max
);
-- Update ratings
UPDATE personal_ratings
SET elo_score = v_new_elo_after,
    comparison_count = comparison_count + 1
WHERE id = v_new_rating.id;
UPDATE personal_ratings
SET elo_score = v_opp_elo_after,
    comparison_count = comparison_count + 1
WHERE id = v_opponent_rating.id;
ELSE -- Skipped: no Elo change
v_new_elo_after := v_new_elo_before;
v_opp_elo_after := v_opp_elo_before;
v_k_new := 0;
v_k_opp := 0;
END IF;
-- -------------------------------------------------------
-- 5. Record comparison
-- -------------------------------------------------------
INSERT INTO comparisons (
        user_id,
        dish_type_id,
        new_rating_id,
        opponent_rating_id,
        result,
        step_number,
        new_elo_before,
        new_elo_after,
        opponent_elo_before,
        opponent_elo_after,
        k_factor_new,
        k_factor_opponent
    )
VALUES (
        v_user_id,
        v_session.dish_type_id,
        v_new_rating.id,
        v_opponent_id,
        p_result,
        v_session.current_step,
        v_new_elo_before,
        v_new_elo_after,
        v_opp_elo_before,
        v_opp_elo_after,
        v_k_new,
        v_k_opp
    );
-- -------------------------------------------------------
-- 6. Advance binary search or complete
-- -------------------------------------------------------
IF p_result = 'skipped' THEN -- Skip ends the battle immediately
v_battle_complete := true;
ELSIF p_result = 'new_wins' THEN -- New dish is better → search upper half (lower indices = higher Elo)
UPDATE battle_sessions
SET high_idx = v_mid_idx - 1,
    current_step = current_step + 1,
    updated_at = now()
WHERE id = p_battle_id;
-- Refresh session
SELECT * INTO v_session
FROM battle_sessions
WHERE id = p_battle_id;
ELSE -- Opponent wins → search lower half
UPDATE battle_sessions
SET low_idx = v_mid_idx + 1,
    current_step = current_step + 1,
    updated_at = now()
WHERE id = p_battle_id;
SELECT * INTO v_session
FROM battle_sessions
WHERE id = p_battle_id;
END IF;
-- Check if search is exhausted
IF v_session.low_idx > v_session.high_idx THEN v_battle_complete := true;
END IF;
-- -------------------------------------------------------
-- 7. If complete: finalize. Otherwise: return next opponent.
-- -------------------------------------------------------
IF v_battle_complete THEN -- Mark battle and rating as completed
UPDATE battle_sessions
SET status = 'completed',
    updated_at = now()
WHERE id = p_battle_id;
UPDATE personal_ratings
SET battle_status = 'completed'
WHERE id = v_new_rating.id;
-- Update profile stats (total_ratings, credibility)
PERFORM _update_profile_stats(v_user_id);
-- Update global leaderboard for the new rating's restaurant+dish
PERFORM _update_global_dish_score(
    (
        SELECT restaurant_id
        FROM personal_ratings
        WHERE id = v_new_rating.id
    ),
    v_session.dish_type_id
);
-- Also update global scores for all opponents whose Elo changed during this battle
FOR v_opp_rest_id IN
SELECT DISTINCT pr.restaurant_id
FROM comparisons c
    JOIN personal_ratings pr ON pr.id = c.opponent_rating_id
WHERE c.new_rating_id = v_new_rating.id
    AND c.result != 'skipped'
    AND pr.restaurant_id != (
        SELECT restaurant_id
        FROM personal_ratings
        WHERE id = v_new_rating.id
    ) LOOP PERFORM _update_global_dish_score(v_opp_rest_id, v_session.dish_type_id);
END LOOP;
-- Evaluate and award any newly earned badges
v_new_badges := public.evaluate_badges(v_user_id);
RETURN jsonb_build_object(
    'battle_complete',
    true,
    'rating_id',
    v_new_rating.id,
    'final_elo',
    v_new_elo_after,
    'final_derived_score',
    ROUND(
        (
            (
                LEAST(GREATEST(v_new_elo_after, v_elo_min), v_elo_max) - 1000
            ) / 1000.0
        ) * 10.0,
        1
    ),
    'comparisons_made',
    v_session.current_step,
    'new_badges',
    v_new_badges
);
ELSE -- Return next opponent
v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
v_opponent_id := v_session.candidate_ids [v_mid_idx + 1];
SELECT pr.id,
    pr.restaurant_id,
    pr.elo_score,
    pr.photo_url,
    ROUND(
        (
            (LEAST(GREATEST(pr.elo_score, 1000), 2000) - 1000) / 1000.0
        ) * 10.0,
        1
    ) AS display_score,
    r.name AS restaurant_name INTO v_next_opp_record
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.id = v_opponent_id;
RETURN jsonb_build_object(
    'battle_complete',
    false,
    'rating_id',
    v_new_rating.id,
    'current_elo',
    v_new_elo_after,
    'opponent',
    jsonb_build_object(
        'rating_id',
        v_next_opp_record.id,
        'restaurant_id',
        v_next_opp_record.restaurant_id,
        'restaurant_name',
        v_next_opp_record.restaurant_name,
        'elo_score',
        v_next_opp_record.elo_score,
        'derived_score',
        v_next_opp_record.display_score,
        'photo_url',
        v_next_opp_record.photo_url
    ),
    'opponent_index',
    v_mid_idx,
    'step',
    v_session.current_step,
    'remaining_range',
    v_session.high_idx - v_session.low_idx + 1
);
END IF;
END;
$$;