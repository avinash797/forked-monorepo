-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Calculate Elo expected score
CREATE OR REPLACE FUNCTION public.calculate_expected_score(elo_a DECIMAL, elo_b DECIMAL) RETURNS DECIMAL LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN 1.0 / (1.0 + POWER(10, (elo_b - elo_a) / 400.0));
END;
$$;
-- Calculate new Elo after match
CREATE OR REPLACE FUNCTION public.calculate_new_elo(
        current_elo DECIMAL,
        expected_score DECIMAL,
        actual_result DECIMAL,
        k_factor INTEGER DEFAULT 32
    ) RETURNS DECIMAL LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE new_elo DECIMAL;
BEGIN new_elo := current_elo + k_factor * (actual_result - expected_score);
-- Clamp between 100 and 3000
RETURN GREATEST(100, LEAST(3000, new_elo));
END;
$$;
-- Get K-factor based on battle count
CREATE OR REPLACE FUNCTION public.get_k_factor(battles_total INTEGER) RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN IF battles_total < 5 THEN RETURN 40;
ELSIF battles_total < 20 THEN RETURN 32;
ELSIF battles_total < 50 THEN RETURN 24;
ELSE RETURN 16;
END IF;
END;
$$;
-- Calculate confidence score
CREATE OR REPLACE FUNCTION public.calculate_confidence_score(
        p_total_battles INTEGER,
        p_win_rate DECIMAL,
        p_total_ratings INTEGER
    ) RETURNS DECIMAL LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE battle_factor DECIMAL;
rating_factor DECIMAL;
BEGIN IF p_total_battles = 0 THEN RETURN 0;
END IF;
battle_factor := LN(p_total_battles + 1);
rating_factor := LEAST(p_total_ratings / 10.0, 1.0);
RETURN ROUND(
    (
        battle_factor * p_win_rate * (0.5 + 0.5 * rating_factor)
    )::NUMERIC,
    3
);
END;
$$;
-- ============================================
-- CHECK IF COMPARISON SHOULD TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.should_trigger_comparison(
        p_user_id UUID,
        p_dish_type_id UUID,
        p_new_raw_score INTEGER,
        p_exclude_rating_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM personal_ratings
        WHERE user_id = p_user_id
            AND dish_type_id = p_dish_type_id
            AND (
                p_exclude_rating_id IS NULL
                OR id != p_exclude_rating_id
            )
            AND ABS(raw_score - p_new_raw_score) <= 2
    );
END;
$$;
-- ============================================
-- GET COMPARISON CANDIDATE
-- ============================================
CREATE OR REPLACE FUNCTION public.get_comparison_candidate(
        p_user_id UUID,
        p_dish_type_id UUID,
        p_new_rating_id UUID,
        p_new_raw_score INTEGER
    ) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE candidate_id UUID;
BEGIN
SELECT id INTO candidate_id
FROM personal_ratings
WHERE user_id = p_user_id
    AND dish_type_id = p_dish_type_id
    AND id != p_new_rating_id
    AND ABS(raw_score - p_new_raw_score) <= 2
ORDER BY ABS(raw_score - p_new_raw_score) ASC,
    battles_total ASC,
    created_at DESC
LIMIT 1;
RETURN candidate_id;
END;
$$;
-- ============================================
-- CREATE RATING (Main Entry Point)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_rating(
        p_restaurant_id UUID,
        p_dish_type_id UUID,
        p_raw_score INTEGER,
        p_photo_url TEXT,
        p_photo_storage_path TEXT DEFAULT NULL,
        p_notes TEXT DEFAULT NULL,
        p_location_verified BOOLEAN DEFAULT false,
        p_taste_tag_ids UUID [] DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_rating_id UUID;
v_should_compare BOOLEAN;
v_candidate_id UUID;
v_city_id UUID;
v_neighborhood_id UUID;
v_tag_id UUID;
BEGIN -- Get current user
v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Get city and neighborhood from restaurant
SELECT city_id,
    neighborhood_id INTO v_city_id,
    v_neighborhood_id
FROM restaurants
WHERE id = p_restaurant_id;
IF v_city_id IS NULL THEN RAISE EXCEPTION 'Restaurant not found';
END IF;
-- Create the rating
INSERT INTO personal_ratings (
        user_id,
        restaurant_id,
        dish_type_id,
        raw_score,
        photo_url,
        photo_storage_path,
        notes,
        location_verified
    )
VALUES (
        v_user_id,
        p_restaurant_id,
        p_dish_type_id,
        p_raw_score,
        p_photo_url,
        p_photo_storage_path,
        p_notes,
        p_location_verified
    ) ON CONFLICT (user_id, restaurant_id, dish_type_id) DO
UPDATE
SET raw_score = EXCLUDED.raw_score,
    photo_url = EXCLUDED.photo_url,
    photo_storage_path = COALESCE(
        EXCLUDED.photo_storage_path,
        personal_ratings.photo_storage_path
    ),
    notes = EXCLUDED.notes,
    location_verified = EXCLUDED.location_verified,
    updated_at = now()
RETURNING id INTO v_rating_id;
-- Add taste tags
IF p_taste_tag_ids IS NOT NULL
AND array_length(p_taste_tag_ids, 1) > 0 THEN -- Clear existing tags for this rating
DELETE FROM personal_rating_tags
WHERE rating_id = v_rating_id;
-- Insert new tags
FOREACH v_tag_id IN ARRAY p_taste_tag_ids LOOP
INSERT INTO personal_rating_tags (rating_id, tag_id)
VALUES (v_rating_id, v_tag_id) ON CONFLICT DO NOTHING;
END LOOP;
END IF;
-- Update user stats
UPDATE profiles
SET total_ratings = total_ratings + 1,
    updated_at = now()
WHERE id = v_user_id;
-- Update or create global dish score
INSERT INTO global_dish_scores (
        restaurant_id,
        dish_type_id,
        city_id,
        neighborhood_id,
        avg_raw_score,
        total_ratings
    )
VALUES (
        p_restaurant_id,
        p_dish_type_id,
        v_city_id,
        v_neighborhood_id,
        p_raw_score,
        1
    ) ON CONFLICT (restaurant_id, dish_type_id, city_id) DO
UPDATE
SET avg_raw_score = (
        (
            global_dish_scores.avg_raw_score * global_dish_scores.total_ratings
        ) + p_raw_score
    ) / (global_dish_scores.total_ratings + 1),
    total_ratings = global_dish_scores.total_ratings + 1,
    updated_at = now();
-- Check if comparison should trigger
v_should_compare := should_trigger_comparison(
    v_user_id,
    p_dish_type_id,
    p_raw_score,
    v_rating_id
);
-- Get comparison candidate
IF v_should_compare THEN v_candidate_id := get_comparison_candidate(
    v_user_id,
    p_dish_type_id,
    v_rating_id,
    p_raw_score
);
END IF;
RETURN jsonb_build_object(
    'rating_id',
    v_rating_id,
    'should_compare',
    v_should_compare,
    'comparison_candidate_id',
    v_candidate_id
);
END;
$$;
-- ============================================
-- PROCESS COMPARISON
-- ============================================
CREATE OR REPLACE FUNCTION public.process_comparison(
        p_dish_type_id UUID,
        p_rating_a_id UUID,
        p_rating_b_id UUID,
        p_winner_id UUID DEFAULT NULL,
        p_skipped BOOLEAN DEFAULT false,
        p_skip_reason TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_comparison_id UUID;
v_elo_a DECIMAL;
v_elo_b DECIMAL;
v_new_elo_a DECIMAL;
v_new_elo_b DECIMAL;
v_expected_a DECIMAL;
v_k_factor_a INTEGER;
v_k_factor_b INTEGER;
v_result_a DECIMAL;
v_battles_a INTEGER;
v_battles_b INTEGER;
v_restaurant_a UUID;
v_restaurant_b UUID;
v_city_id UUID;
v_user_credibility DECIMAL;
BEGIN -- Get current user
v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Validate ratings belong to user and same dish type
IF NOT EXISTS (
    SELECT 1
    FROM personal_ratings
    WHERE id = p_rating_a_id
        AND user_id = v_user_id
        AND dish_type_id = p_dish_type_id
) THEN RAISE EXCEPTION 'Rating A not found or does not belong to user';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM personal_ratings
    WHERE id = p_rating_b_id
        AND user_id = v_user_id
        AND dish_type_id = p_dish_type_id
) THEN RAISE EXCEPTION 'Rating B not found or does not belong to user';
END IF;
-- Get current values
SELECT personal_elo,
    battles_total,
    restaurant_id INTO v_elo_a,
    v_battles_a,
    v_restaurant_a
FROM personal_ratings
WHERE id = p_rating_a_id;
SELECT personal_elo,
    battles_total,
    restaurant_id INTO v_elo_b,
    v_battles_b,
    v_restaurant_b
FROM personal_ratings
WHERE id = p_rating_b_id;
-- Get user credibility
SELECT COALESCE(credibility_score, 1.0) INTO v_user_credibility
FROM profiles
WHERE id = v_user_id;
-- Get city
SELECT city_id INTO v_city_id
FROM restaurants
WHERE id = v_restaurant_a;
IF p_skipped THEN v_new_elo_a := v_elo_a;
v_new_elo_b := v_elo_b;
ELSE -- Calculate Elo changes
v_expected_a := calculate_expected_score(v_elo_a, v_elo_b);
v_result_a := CASE
    WHEN p_winner_id = p_rating_a_id THEN 1.0
    ELSE 0.0
END;
v_k_factor_a := get_k_factor(v_battles_a);
v_k_factor_b := get_k_factor(v_battles_b);
v_new_elo_a := calculate_new_elo(v_elo_a, v_expected_a, v_result_a, v_k_factor_a);
v_new_elo_b := calculate_new_elo(
    v_elo_b,
    1 - v_expected_a,
    1 - v_result_a,
    v_k_factor_b
);
-- Update personal ratings
UPDATE personal_ratings
SET personal_elo = v_new_elo_a,
    battles_total = battles_total + 1,
    battles_won = battles_won + CASE
        WHEN p_winner_id = p_rating_a_id THEN 1
        ELSE 0
    END,
    battles_lost = battles_lost + CASE
        WHEN p_winner_id = p_rating_b_id THEN 1
        ELSE 0
    END,
    updated_at = now()
WHERE id = p_rating_a_id;
UPDATE personal_ratings
SET personal_elo = v_new_elo_b,
    battles_total = battles_total + 1,
    battles_won = battles_won + CASE
        WHEN p_winner_id = p_rating_b_id THEN 1
        ELSE 0
    END,
    battles_lost = battles_lost + CASE
        WHEN p_winner_id = p_rating_a_id THEN 1
        ELSE 0
    END,
    updated_at = now()
WHERE id = p_rating_b_id;
-- Update global scores
PERFORM update_global_elo(
    v_restaurant_a,
    p_dish_type_id,
    v_city_id,
    CASE
        WHEN p_winner_id = p_rating_a_id THEN 1.0
        ELSE 0.0
    END,
    v_user_credibility
);
PERFORM update_global_elo(
    v_restaurant_b,
    p_dish_type_id,
    v_city_id,
    CASE
        WHEN p_winner_id = p_rating_b_id THEN 1.0
        ELSE 0.0
    END,
    v_user_credibility
);
END IF;
-- Record comparison
INSERT INTO comparisons (
        user_id,
        dish_type_id,
        rating_a_id,
        rating_b_id,
        winner_rating_id,
        skipped,
        skip_reason,
        rating_a_elo_before,
        rating_a_elo_after,
        rating_b_elo_before,
        rating_b_elo_after
    )
VALUES (
        v_user_id,
        p_dish_type_id,
        p_rating_a_id,
        p_rating_b_id,
        p_winner_id,
        p_skipped,
        p_skip_reason,
        v_elo_a,
        v_new_elo_a,
        v_elo_b,
        v_new_elo_b
    )
RETURNING id INTO v_comparison_id;
-- Update user stats
UPDATE profiles
SET total_battles = total_battles + 1,
    updated_at = now()
WHERE id = v_user_id;
RETURN jsonb_build_object(
    'comparison_id',
    v_comparison_id,
    'rating_a_new_elo',
    v_new_elo_a,
    'rating_b_new_elo',
    v_new_elo_b,
    'skipped',
    p_skipped
);
END;
$$;
-- ============================================
-- UPDATE GLOBAL ELO (Internal)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_global_elo(
        p_restaurant_id UUID,
        p_dish_type_id UUID,
        p_city_id UUID,
        p_result DECIMAL,
        p_user_credibility DECIMAL DEFAULT 1.0
    ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_current_elo DECIMAL;
v_total_battles INTEGER;
v_battles_won INTEGER;
v_total_ratings INTEGER;
v_k_factor INTEGER;
v_new_elo DECIMAL;
v_win_rate DECIMAL;
v_neighborhood_id UUID;
BEGIN -- Get neighborhood
SELECT neighborhood_id INTO v_neighborhood_id
FROM restaurants
WHERE id = p_restaurant_id;
-- Ensure record exists
INSERT INTO global_dish_scores (
        restaurant_id,
        dish_type_id,
        city_id,
        neighborhood_id
    )
VALUES (
        p_restaurant_id,
        p_dish_type_id,
        p_city_id,
        v_neighborhood_id
    ) ON CONFLICT (restaurant_id, dish_type_id, city_id) DO NOTHING;
-- Get current values
SELECT global_elo,
    total_battles,
    battles_won,
    total_ratings INTO v_current_elo,
    v_total_battles,
    v_battles_won,
    v_total_ratings
FROM global_dish_scores
WHERE restaurant_id = p_restaurant_id
    AND dish_type_id = p_dish_type_id
    AND city_id = p_city_id;
-- K-factor weighted by credibility
v_k_factor := ROUND(
    get_k_factor(v_total_battles) * p_user_credibility
);
-- Simple Elo update against implied 1500 average
v_new_elo := GREATEST(
    100,
    LEAST(
        3000,
        v_current_elo + v_k_factor * (p_result - 0.5)
    )
);
-- Update counts
v_battles_won := v_battles_won + CASE
    WHEN p_result = 1.0 THEN 1
    ELSE 0
END;
v_total_battles := v_total_battles + 1;
v_win_rate := v_battles_won::DECIMAL / NULLIF(v_total_battles, 0);
-- Update record
UPDATE global_dish_scores
SET global_elo = v_new_elo,
    total_battles = v_total_battles,
    battles_won = v_battles_won,
    win_rate = v_win_rate,
    confidence_score = calculate_confidence_score(v_total_battles, v_win_rate, v_total_ratings),
    updated_at = now()
WHERE restaurant_id = p_restaurant_id
    AND dish_type_id = p_dish_type_id
    AND city_id = p_city_id;
END;
$$;
-- ============================================
-- GET LEADERBOARD
-- ============================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
        p_city_id UUID,
        p_dish_type_id UUID,
        p_neighborhood_id UUID DEFAULT NULL,
        p_limit INTEGER DEFAULT 10,
        p_min_battles INTEGER DEFAULT 5,
        p_min_ratings INTEGER DEFAULT 3
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
    AND (
        p_neighborhood_id IS NULL
        OR gds.neighborhood_id = p_neighborhood_id
    )
    AND gds.total_battles >= p_min_battles
    AND gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
ORDER BY gds.global_elo DESC
LIMIT p_limit;
END;
$$;
-- ============================================
-- GET NEARBY LEADERBOARD (with distance)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(
        p_dish_type_id UUID,
        p_latitude DOUBLE PRECISION,
        p_longitude DOUBLE PRECISION,
        p_radius_meters INTEGER DEFAULT 3218,
        -- ~2 miles
        p_limit INTEGER DEFAULT 10
    ) RETURNS TABLE (
        rank BIGINT,
        restaurant_id UUID,
        restaurant_name TEXT,
        neighborhood_name TEXT,
        distance_meters DOUBLE PRECISION,
        global_elo DECIMAL,
        total_battles INTEGER,
        confidence_score DECIMAL,
        featured_photo_url TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_point extensions.GEOGRAPHY;
BEGIN v_user_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY gds.global_elo DESC
    )::BIGINT AS rank,
    gds.restaurant_id,
    r.name AS restaurant_name,
    n.name AS neighborhood_name,
    ST_Distance(r.coordinates, v_user_point) AS distance_meters,
    gds.global_elo,
    gds.total_battles,
    gds.confidence_score,
    gds.featured_photo_url
FROM global_dish_scores gds
    JOIN restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.dish_type_id = p_dish_type_id
    AND ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
    AND gds.total_battles >= 5
    AND gds.total_ratings >= 3
    AND r.is_closed = false
ORDER BY gds.global_elo DESC
LIMIT p_limit;
END;
$$;
-- ============================================
-- GET USER'S BEST EVER (per dish type)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id UUID DEFAULT NULL) RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        raw_score INTEGER,
        personal_elo DECIMAL,
        photo_url TEXT,
        rated_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
RETURN QUERY
SELECT DISTINCT ON (pr.dish_type_id) pr.dish_type_id,
    dt.name AS dish_type_name,
    dt.emoji AS dish_type_emoji,
    pr.id AS rating_id,
    pr.restaurant_id,
    r.name AS restaurant_name,
    c.name AS city_name,
    pr.raw_score,
    pr.personal_elo,
    pr.photo_url,
    pr.created_at AS rated_at
FROM personal_ratings pr
    JOIN dish_types dt ON dt.id = pr.dish_type_id
    JOIN restaurants r ON r.id = pr.restaurant_id
    LEFT JOIN cities c ON c.id = r.city_id
WHERE pr.user_id = v_user_id
ORDER BY pr.dish_type_id,
    pr.personal_elo DESC,
    pr.raw_score DESC;
END;
$$;
-- ============================================
-- GET USER'S RANKINGS FOR A DISH TYPE
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_dish_rankings(
        p_dish_type_id UUID,
        p_user_id UUID DEFAULT NULL
    ) RETURNS TABLE (
        rank BIGINT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        raw_score INTEGER,
        personal_elo DECIMAL,
        battles_total INTEGER,
        photo_url TEXT,
        rated_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY pr.personal_elo DESC,
            pr.raw_score DESC
    )::BIGINT AS rank,
    pr.id AS rating_id,
    pr.restaurant_id,
    r.name AS restaurant_name,
    c.name AS city_name,
    pr.raw_score,
    pr.personal_elo,
    pr.battles_total,
    pr.photo_url,
    pr.created_at AS rated_at
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
    LEFT JOIN cities c ON c.id = r.city_id
WHERE pr.user_id = v_user_id
    AND pr.dish_type_id = p_dish_type_id
ORDER BY pr.personal_elo DESC,
    pr.raw_score DESC;
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