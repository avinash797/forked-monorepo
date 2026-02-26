-- Fix Bug 4: Allow decimals in ratings
ALTER TABLE public.personal_ratings
ALTER COLUMN raw_score TYPE numeric(3, 1);
-- Ensure the Unique Constraint exists (Bug 1 Dependency)
ALTER TABLE public.global_dish_scores
ADD CONSTRAINT global_dish_scores_unique_dish UNIQUE (restaurant_id, dish_type_id);
-- ==============================================================================
-- 1. HELPER: Calculate Logarithmic User Credibility
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.calculate_user_credibility(target_user_id uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE review_count integer;
new_credibility numeric;
BEGIN
SELECT count(*) INTO review_count
FROM public.personal_ratings
WHERE user_id = target_user_id;
-- Formula: 1 + 0.5 * ln(count)
IF review_count > 0 THEN new_credibility := 1.0 + (0.5 * ln(review_count::numeric));
ELSE new_credibility := 1.0;
END IF;
UPDATE public.profiles
SET credibility_score = round(new_credibility, 3),
    total_ratings = review_count,
    updated_at = now()
WHERE id = target_user_id;
RETURN new_credibility;
END;
$$;
-- ==============================================================================
-- 2. CORE LOGIC: Find a "Duel" Candidate
-- Fixes Bug 2: Returns actual candidate_elo instead of calculating from diff
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.find_comparison_candidate(
        p_user_id uuid,
        p_dish_type_id uuid,
        p_current_rating_id uuid,
        p_current_elo numeric
    ) RETURNS TABLE (
        candidate_rating_id uuid,
        candidate_restaurant_name text,
        candidate_score numeric,
        candidate_photo_url text,
        candidate_elo numeric -- Returned directly to fix calculation error
    ) LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN QUERY
SELECT pr.id as candidate_rating_id,
    r.name as candidate_restaurant_name,
    pr.raw_score as candidate_score,
    pr.photo_url as candidate_photo_url,
    pr.personal_elo as candidate_elo -- Return the actual Elo
FROM public.personal_ratings pr
    JOIN public.restaurants r ON pr.restaurant_id = r.id
WHERE pr.user_id = p_user_id
    AND pr.dish_type_id = p_dish_type_id
    AND pr.id != p_current_rating_id -- Optimization: Look for dishes within 400 Elo points
    AND pr.personal_elo BETWEEN (p_current_elo - 400) AND (p_current_elo + 400)
ORDER BY abs(pr.personal_elo - p_current_elo) ASC
LIMIT 1;
END;
$$;
-- ==============================================================================
-- 3. CORE LOGIC: Process the "Duel" (Elo Update)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_comparison(
        p_comparison_id uuid,
        p_winner_rating_id uuid
    ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_comp record;
v_loser_rating_id uuid;
K_factor numeric := 32;
ea_prob numeric;
eb_prob numeric;
actual_score_a numeric;
actual_score_b numeric;
new_elo_a numeric;
new_elo_b numeric;
BEGIN
SELECT * INTO v_comp
FROM public.comparisons
WHERE id = p_comparison_id;
IF v_comp.winner_rating_id IS NOT NULL THEN RAISE EXCEPTION 'Comparison already processed';
END IF;
IF p_winner_rating_id = v_comp.rating_a_id THEN v_loser_rating_id := v_comp.rating_b_id;
actual_score_a := 1;
actual_score_b := 0;
ELSE v_loser_rating_id := v_comp.rating_a_id;
actual_score_a := 0;
actual_score_b := 1;
END IF;
-- Elo Math
ea_prob := 1.0 / (
    1.0 + power(
        10.0,
        (
            v_comp.rating_b_elo_before - v_comp.rating_a_elo_before
        ) / 400.0
    )
);
eb_prob := 1.0 / (
    1.0 + power(
        10.0,
        (
            v_comp.rating_a_elo_before - v_comp.rating_b_elo_before
        ) / 400.0
    )
);
new_elo_a := v_comp.rating_a_elo_before + K_factor * (actual_score_a - ea_prob);
new_elo_b := v_comp.rating_b_elo_before + K_factor * (actual_score_b - eb_prob);
UPDATE public.comparisons
SET winner_rating_id = p_winner_rating_id,
    rating_a_elo_after = round(new_elo_a, 2),
    rating_b_elo_after = round(new_elo_b, 2)
WHERE id = p_comparison_id;
UPDATE public.personal_ratings
SET personal_elo = round(new_elo_a, 2),
    battles_total = battles_total + 1,
    battles_won = battles_won + (
        CASE
            WHEN id = p_winner_rating_id THEN 1
            ELSE 0
        END
    ),
    battles_lost = battles_lost + (
        CASE
            WHEN id != p_winner_rating_id THEN 1
            ELSE 0
        END
    ),
    updated_at = now()
WHERE id = v_comp.rating_a_id;
UPDATE public.personal_ratings
SET personal_elo = round(new_elo_b, 2),
    battles_total = battles_total + 1,
    battles_won = battles_won + (
        CASE
            WHEN id = p_winner_rating_id THEN 1
            ELSE 0
        END
    ),
    battles_lost = battles_lost + (
        CASE
            WHEN id != p_winner_rating_id THEN 1
            ELSE 0
        END
    ),
    updated_at = now()
WHERE id = v_comp.rating_b_id;
PERFORM public.update_global_dish_score(v_comp.rating_a_id);
PERFORM public.update_global_dish_score(v_comp.rating_b_id);
END;
$$;
-- ==============================================================================
-- 4. AGGREGATION: Update Global Leaderboard
-- Fixes Bug 1 (Conflict Clause), Bug 5 (Neighborhood), Bug 7 (Missing Stats)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_global_dish_score(p_rating_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_restaurant_id uuid;
v_dish_type_id uuid;
v_city_id uuid;
v_neighborhood_id uuid;
v_weighted_elo_sum numeric := 0;
v_weighted_raw_sum numeric := 0;
v_total_weight numeric := 0;
v_count integer := 0;
v_total_battles integer := 0;
v_battles_won integer := 0;
v_win_rate numeric := 0;
v_confidence numeric := 0;
BEGIN -- 1. Identify Context (Fix Bug 5: Fetch neighborhood_id)
SELECT pr.restaurant_id,
    pr.dish_type_id,
    r.city_id,
    r.neighborhood_id INTO v_restaurant_id,
    v_dish_type_id,
    v_city_id,
    v_neighborhood_id
FROM public.personal_ratings pr
    JOIN public.restaurants r ON pr.restaurant_id = r.id
WHERE pr.id = p_rating_id;
-- 2. Calculate Weighted Stats (Fix Bug 7: Aggregating battle stats)
SELECT sum(pr.personal_elo * p.credibility_score),
    sum(pr.raw_score * p.credibility_score),
    sum(p.credibility_score),
    count(*),
    sum(pr.battles_total),
    sum(pr.battles_won) INTO v_weighted_elo_sum,
    v_weighted_raw_sum,
    v_total_weight,
    v_count,
    v_total_battles,
    v_battles_won
FROM public.personal_ratings pr
    JOIN public.profiles p ON pr.user_id = p.id
WHERE pr.restaurant_id = v_restaurant_id
    AND pr.dish_type_id = v_dish_type_id;
-- Avoid division by zero
IF v_total_battles > 0 THEN v_win_rate := round(
    v_battles_won::numeric / v_total_battles::numeric,
    4
);
END IF;
-- Calculate confidence score using existing helper
v_confidence := public.calculate_confidence_score(v_total_battles, v_win_rate, v_count);
-- 3. Upsert (Fix Bug 1: Use correct conflict target)
INSERT INTO public.global_dish_scores (
        restaurant_id,
        dish_type_id,
        city_id,
        neighborhood_id,
        global_elo,
        avg_raw_score,
        total_ratings,
        total_battles,
        battles_won,
        win_rate,
        confidence_score,
        updated_at
    )
VALUES (
        v_restaurant_id,
        v_dish_type_id,
        v_city_id,
        v_neighborhood_id,
        round(
            coalesce(
                v_weighted_elo_sum / nullif(v_total_weight, 0),
                1500
            ),
            2
        ),
        round(
            coalesce(v_weighted_raw_sum / nullif(v_total_weight, 0), 0),
            1
        ),
        v_count,
        v_total_battles,
        v_battles_won,
        v_win_rate,
        v_confidence,
        now()
    ) ON CONFLICT (restaurant_id, dish_type_id) DO
UPDATE
SET global_elo = EXCLUDED.global_elo,
    avg_raw_score = EXCLUDED.avg_raw_score,
    total_ratings = EXCLUDED.total_ratings,
    total_battles = EXCLUDED.total_battles,
    battles_won = EXCLUDED.battles_won,
    win_rate = EXCLUDED.win_rate,
    confidence_score = EXCLUDED.confidence_score,
    updated_at = now();
END;
$$;
-- ==============================================================================
-- 5. TRANSACTION: Post Rating & Get Comparison
-- Fixes Bug 3 (Formula), Bug 4 (Numeric Type), Bug 6 (Variation ID)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.post_rating_and_get_duel(
        p_restaurant_id uuid,
        p_dish_type_id uuid,
        p_photo_url text,
        p_raw_score numeric,
        -- Fix Bug 4: Changed to numeric
        p_variation_id uuid DEFAULT NULL,
        -- Fix Bug 6: Added support for variations
        p_notes text DEFAULT NULL
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid := auth.uid();
v_new_rating_id uuid;
v_initial_elo numeric;
v_candidate record;
v_comparison_id uuid;
BEGIN -- Fix Bug 3: Standardized formula (1000 base + 100 per point)
-- 1.0 = 1100, 5.0 = 1500, 10.0 = 2000
v_initial_elo := 1000 + (p_raw_score * 100);
-- Insert Rating (Fix Bug 6: Include variation_id)
INSERT INTO public.personal_ratings (
        user_id,
        restaurant_id,
        dish_type_id,
        variation_id,
        photo_url,
        raw_score,
        personal_elo,
        notes
    )
VALUES (
        v_user_id,
        p_restaurant_id,
        p_dish_type_id,
        p_variation_id,
        p_photo_url,
        p_raw_score,
        v_initial_elo,
        p_notes
    )
RETURNING id INTO v_new_rating_id;
PERFORM public.calculate_user_credibility(v_user_id);
-- Find Duel Candidate
SELECT * INTO v_candidate
FROM public.find_comparison_candidate(
        v_user_id,
        p_dish_type_id,
        v_new_rating_id,
        v_initial_elo
    );
IF v_candidate.candidate_rating_id IS NOT NULL THEN -- Fix Bug 2: Use retrieved candidate_elo directly
INSERT INTO public.comparisons (
        user_id,
        dish_type_id,
        rating_a_id,
        rating_b_id,
        rating_a_elo_before,
        rating_b_elo_before
    )
VALUES (
        v_user_id,
        p_dish_type_id,
        v_new_rating_id,
        v_candidate.candidate_rating_id,
        v_initial_elo,
        v_candidate.candidate_elo
    )
RETURNING id INTO v_comparison_id;
RETURN json_build_object(
    'rating_id',
    v_new_rating_id,
    'has_duel',
    true,
    'duel_data',
    json_build_object(
        'comparison_id',
        v_comparison_id,
        'opponent_name',
        v_candidate.candidate_restaurant_name,
        'opponent_photo',
        v_candidate.candidate_photo_url,
        'opponent_score',
        v_candidate.candidate_score
    )
);
END IF;
-- Return Success without Duel
RETURN json_build_object(
    'rating_id',
    v_new_rating_id,
    'has_duel',
    false
);
END;
$$;
