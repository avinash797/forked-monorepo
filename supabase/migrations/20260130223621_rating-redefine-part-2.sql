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
        'opponent_rating_id',
        v_candidate.candidate_rating_id,
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
