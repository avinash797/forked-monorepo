-- Migration: Fix raw_score INTEGER → NUMERIC in all RPC functions
-- The rating-redefine migration changed personal_ratings.raw_score from INTEGER to NUMERIC(3,1)
-- but existing RPC return types and parameters still declared INTEGER, causing error 42804:
-- "structure of query does not match function result type"

-- ============================================
-- 1. get_my_best_ever: raw_score INTEGER → NUMERIC (return type change → must DROP)
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_best_ever(UUID);
CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id UUID DEFAULT NULL) RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        dish_type_emoji TEXT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        raw_score NUMERIC,
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
-- 2. get_my_dish_rankings: raw_score INTEGER → NUMERIC (return type change → must DROP)
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_dish_rankings(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_my_dish_rankings(
        p_dish_type_id UUID,
        p_user_id UUID DEFAULT NULL
    ) RETURNS TABLE (
        rank BIGINT,
        rating_id UUID,
        restaurant_id UUID,
        restaurant_name TEXT,
        city_name TEXT,
        raw_score NUMERIC,
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
-- 3. get_pending_comparisons: rating_a/b_raw_score INTEGER → NUMERIC (return type change → must DROP)
-- ============================================
DROP FUNCTION IF EXISTS public.get_pending_comparisons(INTEGER);
CREATE OR REPLACE FUNCTION public.get_pending_comparisons(p_limit INTEGER DEFAULT 5) RETURNS TABLE (
        dish_type_id UUID,
        dish_type_name TEXT,
        rating_a_id UUID,
        rating_a_restaurant TEXT,
        rating_a_photo TEXT,
        rating_a_raw_score NUMERIC,
        rating_b_id UUID,
        rating_b_restaurant TEXT,
        rating_b_photo TEXT,
        rating_b_raw_score NUMERIC
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
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
-- ============================================
-- 4. should_trigger_comparison: p_new_raw_score INTEGER → NUMERIC (param type change → DROP old signature)
-- ============================================
DROP FUNCTION IF EXISTS public.should_trigger_comparison(UUID, UUID, INTEGER, UUID);
CREATE OR REPLACE FUNCTION public.should_trigger_comparison(
        p_user_id UUID,
        p_dish_type_id UUID,
        p_new_raw_score NUMERIC,
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
-- 5. get_comparison_candidate: p_new_raw_score INTEGER → NUMERIC (param type change → DROP old signature)
-- ============================================
DROP FUNCTION IF EXISTS public.get_comparison_candidate(UUID, UUID, UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.get_comparison_candidate(
        p_user_id UUID,
        p_dish_type_id UUID,
        p_new_rating_id UUID,
        p_new_raw_score NUMERIC
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
-- 6. create_rating: p_raw_score INTEGER → NUMERIC (param type change → DROP old signature)
-- ============================================
DROP FUNCTION IF EXISTS public.create_rating(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, UUID[]);
CREATE OR REPLACE FUNCTION public.create_rating(
        p_restaurant_id UUID,
        p_dish_type_id UUID,
        p_raw_score NUMERIC,
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
BEGIN
v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT city_id,
    neighborhood_id INTO v_city_id,
    v_neighborhood_id
FROM restaurants
WHERE id = p_restaurant_id;
IF v_city_id IS NULL THEN RAISE EXCEPTION 'Restaurant not found';
END IF;
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
IF p_taste_tag_ids IS NOT NULL
AND array_length(p_taste_tag_ids, 1) > 0 THEN
DELETE FROM personal_rating_tags
WHERE rating_id = v_rating_id;
FOREACH v_tag_id IN ARRAY p_taste_tag_ids LOOP
INSERT INTO personal_rating_tags (rating_id, tag_id)
VALUES (v_rating_id, v_tag_id) ON CONFLICT DO NOTHING;
END LOOP;
END IF;
UPDATE profiles
SET total_ratings = total_ratings + 1,
    updated_at = now()
WHERE id = v_user_id;
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
v_should_compare := should_trigger_comparison(
    v_user_id,
    p_dish_type_id,
    p_raw_score,
    v_rating_id
);
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
-- 7. update_existing_rating: p_new_raw_score INTEGER → NUMERIC (param type change → DROP old signature)
-- ============================================
DROP FUNCTION IF EXISTS public.update_existing_rating(UUID, INTEGER, TEXT, TEXT, UUID[]);
CREATE OR REPLACE FUNCTION public.update_existing_rating(
        p_rating_id UUID,
        p_new_raw_score NUMERIC,
        p_new_photo_url TEXT DEFAULT NULL,
        p_new_notes TEXT DEFAULT NULL,
        p_taste_tag_ids UUID [] DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_old_score NUMERIC;
v_dish_type_id UUID;
v_restaurant_id UUID;
v_should_compare BOOLEAN := FALSE;
v_candidate_id UUID;
v_score_changed BOOLEAN;
v_tag_id UUID;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
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
IF NOT EXISTS (
    SELECT 1
    FROM personal_ratings
    WHERE id = p_rating_id
        AND user_id = v_user_id
) THEN RAISE EXCEPTION 'Rating does not belong to user';
END IF;
v_score_changed := (v_old_score != p_new_raw_score);
UPDATE personal_ratings
SET raw_score = p_new_raw_score,
    photo_url = COALESCE(p_new_photo_url, photo_url),
    notes = COALESCE(p_new_notes, notes),
    updated_at = now()
WHERE id = p_rating_id;
IF p_taste_tag_ids IS NOT NULL THEN
DELETE FROM personal_rating_tags
WHERE rating_id = p_rating_id;
FOREACH v_tag_id IN ARRAY p_taste_tag_ids LOOP
INSERT INTO personal_rating_tags (rating_id, tag_id)
VALUES (p_rating_id, v_tag_id) ON CONFLICT DO NOTHING;
END LOOP;
END IF;
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
