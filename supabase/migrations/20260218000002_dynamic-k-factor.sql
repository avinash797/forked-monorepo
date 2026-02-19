-- =============================================================================
-- Migration: Dynamic K-Factor in submit_comparison
--
-- Problem: submit_comparison uses a fixed K=32 for all battles regardless of
--          how many battles a rating has already fought. A rating with 100
--          battles should be far more stable than one with 2 battles.
--
-- Fix: Apply get_k_factor(battles_total) per rating individually, using each
--      rating's own battle count before the current battle. This means:
--        - New ratings (< 5 battles)   → K = 40  high volatility, still calibrating
--        - Mid ratings (< 20 battles)  → K = 32  settling in
--        - Older ratings (< 50 battles)→ K = 24  mostly stable
--        - Established (50+ battles)   → K = 16  very stable
--
--      Each rating absorbs the battle result at its own volatility level.
--      When a new rating (K=40) fights an established one (K=16), the newcomer
--      swings more — correct behaviour, it is still being positioned.
--
-- Note: get_k_factor() already exists from the initial RPC functions migration.
--       This migration only wires it into submit_comparison.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_comparison(
    p_comparison_id    uuid,
    p_winner_rating_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comp       record;
    v_battles_a  integer;
    v_battles_b  integer;
    v_k_factor_a integer;
    v_k_factor_b integer;
    ea_prob      numeric;
    eb_prob      numeric;
    actual_score_a numeric;
    actual_score_b numeric;
    new_elo_a    numeric;
    new_elo_b    numeric;
BEGIN
    SELECT * INTO v_comp
    FROM public.comparisons
    WHERE id = p_comparison_id;

    IF v_comp.winner_rating_id IS NOT NULL THEN
        RAISE EXCEPTION 'Comparison already processed';
    END IF;

    IF p_winner_rating_id = v_comp.rating_a_id THEN
        actual_score_a := 1;
        actual_score_b := 0;
    ELSE
        actual_score_a := 0;
        actual_score_b := 1;
    END IF;

    -- Fetch each rating's current battle count to derive its individual K-factor.
    -- We read battles_total BEFORE this battle is recorded so the K-factor
    -- reflects the rating's experience going into this fight, not after.
    SELECT battles_total INTO v_battles_a
    FROM public.personal_ratings WHERE id = v_comp.rating_a_id;

    SELECT battles_total INTO v_battles_b
    FROM public.personal_ratings WHERE id = v_comp.rating_b_id;

    v_k_factor_a := public.get_k_factor(v_battles_a);
    v_k_factor_b := public.get_k_factor(v_battles_b);

    -- Elo expected scores (unchanged)
    ea_prob := 1.0 / (1.0 + power(10.0, (v_comp.rating_b_elo_before - v_comp.rating_a_elo_before) / 400.0));
    eb_prob := 1.0 / (1.0 + power(10.0, (v_comp.rating_a_elo_before - v_comp.rating_b_elo_before) / 400.0));

    -- Each rating moves by its own K-factor
    new_elo_a := ROUND(v_comp.rating_a_elo_before + v_k_factor_a * (actual_score_a - ea_prob), 2);
    new_elo_b := ROUND(v_comp.rating_b_elo_before + v_k_factor_b * (actual_score_b - eb_prob), 2);

    -- Stamp the comparison record
    UPDATE public.comparisons
    SET winner_rating_id   = p_winner_rating_id,
        rating_a_elo_after = new_elo_a,
        rating_b_elo_after = new_elo_b
    WHERE id = p_comparison_id;

    -- Update personal elos and battle counts
    UPDATE public.personal_ratings
    SET personal_elo  = new_elo_a,
        battles_total = battles_total + 1,
        battles_won   = battles_won + CASE WHEN id = p_winner_rating_id THEN 1 ELSE 0 END,
        battles_lost  = battles_lost + CASE WHEN id <> p_winner_rating_id THEN 1 ELSE 0 END,
        updated_at    = now()
    WHERE id = v_comp.rating_a_id;

    UPDATE public.personal_ratings
    SET personal_elo  = new_elo_b,
        battles_total = battles_total + 1,
        battles_won   = battles_won + CASE WHEN id = p_winner_rating_id THEN 1 ELSE 0 END,
        battles_lost  = battles_lost + CASE WHEN id <> p_winner_rating_id THEN 1 ELSE 0 END,
        updated_at    = now()
    WHERE id = v_comp.rating_b_id;

    -- O(1) incremental global score updates
    PERFORM public.update_global_dish_score(
        v_comp.rating_a_id,
        v_comp.rating_a_elo_before,
        new_elo_a,
        p_winner_rating_id = v_comp.rating_a_id
    );
    PERFORM public.update_global_dish_score(
        v_comp.rating_b_id,
        v_comp.rating_b_elo_before,
        new_elo_b,
        p_winner_rating_id = v_comp.rating_b_id
    );
END;
$$;
