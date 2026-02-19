-- ============================================
-- GET LEADERBOARD WITH TIEBREAKERS (Alternative)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_tiebreakers(
        p_city_id UUID,
        p_dish_type_id UUID,
        p_limit INTEGER DEFAULT 10
    ) RETURNS TABLE (
        rank BIGINT,
        restaurant_id UUID,
        restaurant_name TEXT,
        neighborhood_name TEXT,
        global_elo DECIMAL,
        total_battles INTEGER,
        win_rate DECIMAL,
        confidence_score DECIMAL,
        avg_raw_score DECIMAL,
        total_ratings INTEGER,
        featured_photo_url TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY gds.global_elo DESC,
            gds.win_rate DESC,
            gds.total_battles DESC,
            gds.avg_raw_score DESC,
            gds.created_at ASC
    )::BIGINT AS rank,
    gds.restaurant_id,
    r.name AS restaurant_name,
    n.name AS neighborhood_name,
    gds.global_elo,
    gds.total_battles,
    gds.win_rate,
    gds.confidence_score,
    gds.avg_raw_score,
    gds.total_ratings,
    gds.featured_photo_url
FROM global_dish_scores gds
    JOIN restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.city_id = p_city_id
    AND gds.dish_type_id = p_dish_type_id
    AND gds.total_battles >= 5
    AND gds.total_ratings >= 3
    AND r.is_closed = false
ORDER BY gds.global_elo DESC,
    gds.win_rate DESC,
    gds.total_battles DESC
LIMIT p_limit;
END;
$$;
-- ============================================
-- CLAMP ELO (Keep scores in reasonable range)
-- ============================================
CREATE OR REPLACE FUNCTION public.clamp_elo(p_elo DECIMAL) RETURNS DECIMAL LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN GREATEST(100, LEAST(3000, p_elo));
END;
$$;
-- ============================================
-- CALCULATE NEW ELO CLAMPED
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_new_elo_clamped(
        current_elo DECIMAL,
        expected_score DECIMAL,
        actual_result DECIMAL,
        k_factor INTEGER DEFAULT 32
    ) RETURNS DECIMAL LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN clamp_elo(
        current_elo + k_factor * (actual_result - expected_score)
    );
END;
$$;
-- ============================================
-- VALIDATE COMPARISON (Ensure valid battle)
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_comparison(
        p_rating_a_id UUID,
        p_rating_b_id UUID
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_dish_type_a UUID;
v_dish_type_b UUID;
v_user_a UUID;
v_user_b UUID;
BEGIN
SELECT dish_type_id,
    user_id INTO v_dish_type_a,
    v_user_a
FROM personal_ratings
WHERE id = p_rating_a_id;
SELECT dish_type_id,
    user_id INTO v_dish_type_b,
    v_user_b
FROM personal_ratings
WHERE id = p_rating_b_id;
-- Rating A must exist
IF v_dish_type_a IS NULL THEN RAISE EXCEPTION 'Rating A not found';
END IF;
-- Rating B must exist
IF v_dish_type_b IS NULL THEN RAISE EXCEPTION 'Rating B not found';
END IF;
-- Must be same dish type
IF v_dish_type_a != v_dish_type_b THEN RAISE EXCEPTION 'Cannot compare different dish types';
END IF;
-- Must be same user
IF v_user_a != v_user_b THEN RAISE EXCEPTION 'Cannot compare ratings from different users';
END IF;
-- Cannot compare dish with itself
IF p_rating_a_id = p_rating_b_id THEN RAISE EXCEPTION 'Cannot compare a dish with itself';
END IF;
RETURN TRUE;
END;
$$;
-- ============================================
-- CHECK USER SKIP RATE
-- ============================================
CREATE OR REPLACE FUNCTION public.check_user_skip_rate(p_user_id UUID DEFAULT NULL) RETURNS TABLE (
        total_comparisons BIGINT,
        skipped_count BIGINT,
        skip_rate DECIMAL,
        should_warn BOOLEAN
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_total BIGINT;
v_skipped BIGINT;
v_rate DECIMAL;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT COUNT(*),
    COUNT(*) FILTER (
        WHERE skipped = TRUE
    ) INTO v_total,
    v_skipped
FROM comparisons
WHERE user_id = v_user_id
    AND created_at > now() - INTERVAL '30 days';
v_rate := CASE
    WHEN v_total > 0 THEN v_skipped::DECIMAL / v_total
    ELSE 0
END;
RETURN QUERY
SELECT v_total,
    v_skipped,
    ROUND(v_rate, 3),
    (
        v_rate > 0.5
        AND v_total >= 10
    );
END;
$$;
-- ============================================
-- CHECK RATE LIMIT (Anti-fraud)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id UUID DEFAULT NULL) RETURNS TABLE (
        is_rate_limited BOOLEAN,
        ratings_last_hour INTEGER,
        max_allowed INTEGER,
        can_rate BOOLEAN
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_count INTEGER;
v_max INTEGER := 20;
-- Max 20 ratings per hour
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT COUNT(*)::INTEGER INTO v_count
FROM personal_ratings
WHERE user_id = v_user_id
    AND created_at > now() - INTERVAL '1 hour';
RETURN QUERY
SELECT (v_count >= v_max),
    v_count,
    v_max,
    (v_count < v_max);
END;
$$;
-- ============================================
-- UPDATE EXISTING RATING
-- ============================================
CREATE OR REPLACE FUNCTION public.update_existing_rating(
        p_rating_id UUID,
        p_new_raw_score INTEGER,
        p_new_photo_url TEXT DEFAULT NULL,
        p_new_notes TEXT DEFAULT NULL,
        p_taste_tag_ids UUID [] DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_old_score INTEGER;
v_dish_type_id UUID;
v_restaurant_id UUID;
v_should_compare BOOLEAN := FALSE;
v_candidate_id UUID;
v_score_changed BOOLEAN;
v_tag_id UUID;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Get current values and verify ownership
SELECT raw_score,
    dish_type_id,
    restaurant_id,
    user_id INTO v_old_score,
    v_dish_type_id,
    v_restaurant_id
FROM personal_ratings
WHERE id = p_rating_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Rating not found';
END IF;
-- Verify ownership
IF NOT EXISTS (
    SELECT 1
    FROM personal_ratings
    WHERE id = p_rating_id
        AND user_id = v_user_id
) THEN RAISE EXCEPTION 'Rating does not belong to user';
END IF;
v_score_changed := (v_old_score != p_new_raw_score);
-- Update the rating
UPDATE personal_ratings
SET raw_score = p_new_raw_score,
    photo_url = COALESCE(p_new_photo_url, photo_url),
    notes = COALESCE(p_new_notes, notes),
    updated_at = now()
WHERE id = p_rating_id;
-- Update tags if provided
IF p_taste_tag_ids IS NOT NULL THEN
DELETE FROM personal_rating_tags
WHERE rating_id = p_rating_id;
FOREACH v_tag_id IN ARRAY p_taste_tag_ids LOOP
INSERT INTO personal_rating_tags (rating_id, tag_id)
VALUES (p_rating_id, v_tag_id) ON CONFLICT DO NOTHING;
END LOOP;
END IF;
-- Update global average score
UPDATE global_dish_scores gds
SET avg_raw_score = (
        SELECT AVG(pr.raw_score)
        FROM personal_ratings pr
        WHERE pr.restaurant_id = v_restaurant_id
            AND pr.dish_type_id = v_dish_type_id
    ),
    updated_at = now()
WHERE gds.restaurant_id = v_restaurant_id
    AND gds.dish_type_id = v_dish_type_id;
-- If score changed significantly, might need new comparison
IF v_score_changed THEN v_should_compare := should_trigger_comparison(
    v_user_id,
    v_dish_type_id,
    p_new_raw_score,
    p_rating_id
);
IF v_should_compare THEN v_candidate_id := get_comparison_candidate(
    v_user_id,
    v_dish_type_id,
    p_rating_id,
    p_new_raw_score
);
END IF;
END IF;
RETURN jsonb_build_object(
    'rating_id',
    p_rating_id,
    'score_changed',
    v_score_changed,
    'should_compare',
    v_should_compare,
    'comparison_candidate_id',
    v_candidate_id
);
END;
$$;
-- ============================================
-- CLOSE RESTAURANT (Soft delete)
-- ============================================
CREATE OR REPLACE FUNCTION public.close_restaurant(p_restaurant_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_restaurant_name TEXT;
BEGIN -- This should be admin-only in production
-- For now, just execute the update
UPDATE restaurants
SET is_closed = TRUE,
    closed_at = now(),
    updated_at = now()
WHERE id = p_restaurant_id
RETURNING name INTO v_restaurant_name;
IF NOT FOUND THEN RAISE EXCEPTION 'Restaurant not found';
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'restaurant_id',
    p_restaurant_id,
    'restaurant_name',
    v_restaurant_name,
    'closed_at',
    now()
);
END;
$$;
-- ============================================
-- ANONYMIZE USER DATA (GDPR compliance)
-- ============================================
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id UUID DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_ratings_count INTEGER;
v_comparisons_count INTEGER;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
-- Only allow users to anonymize their own data (or admin)
IF v_user_id != auth.uid() THEN -- In production, check for admin role here
RAISE EXCEPTION 'Can only anonymize your own data';
END IF;
-- Count affected records
SELECT COUNT(*) INTO v_ratings_count
FROM personal_ratings
WHERE user_id = v_user_id;
SELECT COUNT(*) INTO v_comparisons_count
FROM comparisons
WHERE user_id = v_user_id;
-- Anonymize profile
UPDATE profiles
SET username = 'deleted_' || SUBSTRING(id::TEXT, 1, 8),
    display_name = 'Deleted User',
    avatar_url = NULL,
    bio = NULL,
    expo_push_token = NULL,
    push_enabled = FALSE,
    updated_at = now()
WHERE id = v_user_id;
-- Remove personal notes from ratings (keep ratings for leaderboard integrity)
UPDATE personal_ratings
SET notes = NULL,
    updated_at = now()
WHERE user_id = v_user_id;
-- Don't delete comparisons - they contribute to global Elo integrity
-- Don't delete ratings - they contribute to leaderboard integrity
RETURN jsonb_build_object(
    'success',
    true,
    'user_id',
    v_user_id,
    'ratings_anonymized',
    v_ratings_count,
    'comparisons_preserved',
    v_comparisons_count,
    'note',
    'Ratings preserved for leaderboard integrity. Personal data removed.'
);
END;
$$;
-- ============================================
-- DELETE USER ACCOUNT (Full deletion)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_user_account(p_confirm BOOLEAN DEFAULT FALSE) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_ratings_count INTEGER;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
IF NOT p_confirm THEN RAISE EXCEPTION 'Must confirm deletion by passing p_confirm = true';
END IF;
-- Count ratings before deletion
SELECT COUNT(*) INTO v_ratings_count
FROM personal_ratings
WHERE user_id = v_user_id;
-- Delete all user data (cascades handle related records)
DELETE FROM personal_ratings
WHERE user_id = v_user_id;
DELETE FROM comparisons
WHERE user_id = v_user_id;
DELETE FROM profiles
WHERE id = v_user_id;
-- Note: This doesn't delete from auth.users - that must be done separately
-- via Supabase Admin API or Dashboard
RETURN jsonb_build_object(
    'success',
    true,
    'user_id',
    v_user_id,
    'ratings_deleted',
    v_ratings_count,
    'note',
    'Profile and ratings deleted. Auth account must be deleted separately.'
);
END;
$$;
-- ============================================
-- GET USER STATS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_result JSONB;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT jsonb_build_object(
        'user_id',
        p.id,
        'username',
        p.username,
        'total_ratings',
        p.total_ratings,
        'total_battles',
        p.total_battles,
        'credibility_score',
        p.credibility_score,
        'dishes_by_type',
        (
            SELECT jsonb_object_agg(dt.name, cnt)
            FROM (
                    SELECT dish_type_id,
                        COUNT(*) as cnt
                    FROM personal_ratings
                    WHERE user_id = v_user_id
                    GROUP BY dish_type_id
                ) r
                JOIN dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',
        (
            SELECT COUNT(DISTINCT r.city_id)
            FROM personal_ratings pr
                JOIN restaurants r ON r.id = pr.restaurant_id
            WHERE pr.user_id = v_user_id
        ),
        'member_since',
        p.created_at,
        'skip_rate',
        (
            SELECT ROUND(
                    COUNT(*) FILTER (
                        WHERE skipped
                    )::DECIMAL / NULLIF(COUNT(*), 0),
                    3
                )
            FROM comparisons
            WHERE user_id = v_user_id
        )
    ) INTO v_result
FROM profiles p
WHERE p.id = v_user_id;
RETURN v_result;
END;
$$;
-- ============================================
-- RECALCULATE GLOBAL SCORES (Admin/Maintenance)
-- ============================================
CREATE OR REPLACE FUNCTION public.recalculate_global_scores(
        p_city_id UUID DEFAULT NULL,
        p_dish_type_id UUID DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_updated_count INTEGER := 0;
BEGIN -- Recalculate average scores and confidence
UPDATE global_dish_scores gds
SET avg_raw_score = sub.avg_score,
    total_ratings = sub.rating_count,
    win_rate = CASE
        WHEN gds.total_battles > 0 THEN gds.battles_won::DECIMAL / gds.total_battles
        ELSE 0
    END,
    confidence_score = calculate_confidence_score(
        gds.total_battles,
        CASE
            WHEN gds.total_battles > 0 THEN gds.battles_won::DECIMAL / gds.total_battles
            ELSE 0
        END,
        sub.rating_count
    ),
    updated_at = now()
FROM (
        SELECT restaurant_id,
            dish_type_id,
            AVG(raw_score) as avg_score,
            COUNT(*) as rating_count
        FROM personal_ratings
        GROUP BY restaurant_id,
            dish_type_id
    ) sub
WHERE gds.restaurant_id = sub.restaurant_id
    AND gds.dish_type_id = sub.dish_type_id
    AND (
        p_city_id IS NULL
        OR gds.city_id = p_city_id
    )
    AND (
        p_dish_type_id IS NULL
        OR gds.dish_type_id = p_dish_type_id
    );
GET DIAGNOSTICS v_updated_count = ROW_COUNT;
RETURN jsonb_build_object(
    'success',
    true,
    'records_updated',
    v_updated_count,
    'city_filter',
    p_city_id,
    'dish_type_filter',
    p_dish_type_id
);
END;
$$;
-- ============================================
-- GET PENDING COMPARISONS FOR USER
-- ============================================
CREATE OR REPLACE FUNCTION public.get_pending_comparisons(p_limit INTEGER DEFAULT 5) RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        rating_a_id UUID,
        rating_a_restaurant TEXT,
        rating_a_photo TEXT,
        rating_a_raw_score INTEGER,
        rating_b_id UUID,
        rating_b_restaurant TEXT,
        rating_b_photo TEXT,
        rating_b_raw_score INTEGER
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Find pairs of ratings that are close in score and haven't been compared
RETURN QUERY
SELECT DISTINCT ON (pr1.dish_type_id) pr1.dish_type_id,
    dt.name AS dish_type_name,
    pr1.id AS rating_a_id,
    r1.name AS rating_a_restaurant,
    pr1.photo_url AS rating_a_photo,
    pr1.raw_score AS rating_a_raw_score,
    pr2.id AS rating_b_id,
    r2.name AS rating_b_restaurant,
    pr2.photo_url AS rating_b_photo,
    pr2.raw_score AS rating_b_raw_score
FROM personal_ratings pr1
    JOIN personal_ratings pr2 ON pr1.user_id = pr2.user_id
    AND pr1.dish_type_id = pr2.dish_type_id
    AND pr1.id < pr2.id
    JOIN dish_types dt ON dt.id = pr1.dish_type_id
    JOIN restaurants r1 ON r1.id = pr1.restaurant_id
    JOIN restaurants r2 ON r2.id = pr2.restaurant_id
    LEFT JOIN comparisons c ON c.user_id = pr1.user_id
    AND (
        (
            c.rating_a_id = pr1.id
            AND c.rating_b_id = pr2.id
        )
        OR (
            c.rating_a_id = pr2.id
            AND c.rating_b_id = pr1.id
        )
    )
WHERE pr1.user_id = v_user_id
    AND ABS(pr1.raw_score - pr2.raw_score) <= 2
    AND c.id IS NULL
ORDER BY pr1.dish_type_id,
    ABS(pr1.raw_score - pr2.raw_score) ASC
LIMIT p_limit;
END;
$$;