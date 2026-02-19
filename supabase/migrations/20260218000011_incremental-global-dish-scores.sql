-- =============================================================================
-- Migration: Incremental Global Dish Score Updates
--
-- Problem: update_global_dish_score re-aggregates ALL personal_ratings for a
--          dish on every battle completion. As ratings grow the cost is O(N)
--          per battle, called twice — so O(2N) per comparison. On a popular
--          dish with 500 ratings this fires a 500-row JOIN on every vote.
--
-- Fix: Store three running totals directly on global_dish_scores:
--        weighted_elo_sum  = SUM(personal_elo   × credibility)
--        weighted_raw_sum  = SUM(raw_score       × credibility)
--        total_weight      = SUM(credibility)
--
--      global_elo    = weighted_elo_sum / total_weight   (derived, stored)
--      avg_raw_score = weighted_raw_sum / total_weight   (derived, stored)
--
--      Any update is now O(1): compute a delta, add it to the running total,
--      re-derive the scalar. No full scan ever needed again.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Add running total columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.global_dish_scores
    ADD COLUMN IF NOT EXISTS weighted_elo_sum DECIMAL(16, 4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS weighted_raw_sum DECIMAL(14, 4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_weight     DECIMAL(12, 4) NOT NULL DEFAULT 0;


-- -----------------------------------------------------------------------------
-- 2. Backfill running totals from existing data  (one-time full scan)
--    After this runs it will never be needed again — all future writes are
--    incremental.
-- -----------------------------------------------------------------------------
UPDATE public.global_dish_scores gds
SET
    weighted_elo_sum = COALESCE(agg.w_elo,   0),
    weighted_raw_sum = COALESCE(agg.w_raw,   0),
    total_weight     = COALESCE(agg.w_total, 0)
FROM (
    SELECT
        pr.restaurant_id,
        pr.dish_type_id,
        SUM(pr.personal_elo       * p.credibility_score) AS w_elo,
        SUM(pr.raw_score::NUMERIC * p.credibility_score) AS w_raw,
        SUM(p.credibility_score)                         AS w_total
    FROM  public.personal_ratings pr
    JOIN  public.profiles p ON p.id = pr.user_id
    GROUP BY pr.restaurant_id, pr.dish_type_id
) agg
WHERE gds.restaurant_id = agg.restaurant_id
  AND gds.dish_type_id  = agg.dish_type_id;

-- Sync the derived scalar columns from the now-correct running totals
UPDATE public.global_dish_scores
SET
    global_elo    = ROUND(weighted_elo_sum / NULLIF(total_weight, 0), 2),
    avg_raw_score = ROUND(weighted_raw_sum / NULLIF(total_weight, 0), 1)
WHERE total_weight > 0;


-- -----------------------------------------------------------------------------
-- 3. Drop the old single-argument update_global_dish_score so the new
--    four-argument version does not silently coexist with it.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_global_dish_score(uuid);


-- -----------------------------------------------------------------------------
-- 4. Incremental update_global_dish_score  —  O(1), no aggregation scan
--
--    Called once per rating involved in a battle.
--    Receives the rating id, its elo before and after, and whether it won.
--    Applies delta = (new_elo - old_elo) × credibility to the running sum
--    and increments battle stats — all in a single-row UPDATE.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_global_dish_score(
    p_rating_id uuid,
    p_old_elo   numeric,
    p_new_elo   numeric,
    p_won       boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_restaurant_id uuid;
    v_dish_type_id  uuid;
    v_credibility   numeric;
    v_elo_delta     numeric;
BEGIN
    -- Two-table point lookup — no aggregation
    SELECT pr.restaurant_id, pr.dish_type_id, p.credibility_score
    INTO   v_restaurant_id, v_dish_type_id, v_credibility
    FROM   public.personal_ratings pr
    JOIN   public.profiles p ON p.id = pr.user_id
    WHERE  pr.id = p_rating_id;

    v_elo_delta := (p_new_elo - p_old_elo) * v_credibility;

    UPDATE public.global_dish_scores
    SET
        -- Running total update
        weighted_elo_sum = weighted_elo_sum + v_elo_delta,
        -- Re-derive global_elo from the new running total in one expression
        global_elo       = ROUND(
                               (weighted_elo_sum + v_elo_delta) / NULLIF(total_weight, 0),
                               2
                           ),
        -- Incremental battle stats
        total_battles    = total_battles + 1,
        battles_won      = battles_won + CASE WHEN p_won THEN 1 ELSE 0 END,
        win_rate         = ROUND(
                               (battles_won + CASE WHEN p_won THEN 1 ELSE 0 END)::numeric
                               / NULLIF(total_battles + 1, 0),
                               4
                           ),
        confidence_score = public.calculate_confidence_score(
                               total_battles + 1,
                               ROUND(
                                   (battles_won + CASE WHEN p_won THEN 1 ELSE 0 END)::numeric
                                   / NULLIF(total_battles + 1, 0),
                                   4
                               ),
                               total_ratings
                           ),
        updated_at       = now()
    WHERE restaurant_id = v_restaurant_id
      AND dish_type_id  = v_dish_type_id;
END;
$$;


-- -----------------------------------------------------------------------------
-- 5. Update submit_comparison to pass old/new elos to the incremental function
--    Elo math is unchanged — only the global score update call changes.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_comparison(
    p_comparison_id    uuid,
    p_winner_rating_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comp         record;
    K_factor       numeric := 32;
    ea_prob        numeric;
    eb_prob        numeric;
    actual_score_a numeric;
    actual_score_b numeric;
    new_elo_a      numeric;
    new_elo_b      numeric;
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

    -- Elo math (unchanged)
    ea_prob   := 1.0 / (1.0 + power(10.0, (v_comp.rating_b_elo_before - v_comp.rating_a_elo_before) / 400.0));
    eb_prob   := 1.0 / (1.0 + power(10.0, (v_comp.rating_a_elo_before - v_comp.rating_b_elo_before) / 400.0));
    new_elo_a := ROUND(v_comp.rating_a_elo_before + K_factor * (actual_score_a - ea_prob), 2);
    new_elo_b := ROUND(v_comp.rating_b_elo_before + K_factor * (actual_score_b - eb_prob), 2);

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
    -- Old approach: two O(N) full re-aggregations
    -- New approach: two O(1) delta applications
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


-- -----------------------------------------------------------------------------
-- 6. Update post_rating_and_get_duel to seed running totals on new rating
--    When the first rating for a dish arrives the running totals are
--    initialised; subsequent ratings add their weighted contribution.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.post_rating_and_get_duel(
    p_restaurant_id uuid,
    p_dish_type_id  uuid,
    p_photo_url     text,
    p_raw_score     numeric,
    p_variation_id  uuid DEFAULT NULL,
    p_notes         text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id         uuid := auth.uid();
    v_new_rating_id   uuid;
    v_initial_elo     numeric;
    v_candidate       record;
    v_comparison_id   uuid;
    v_credibility     numeric;
    v_city_id         uuid;
    v_neighborhood_id uuid;
BEGIN
    v_initial_elo := 1000 + (p_raw_score * 100);

    INSERT INTO public.personal_ratings (
        user_id, restaurant_id, dish_type_id, variation_id,
        photo_url, raw_score, personal_elo, notes
    )
    VALUES (
        v_user_id, p_restaurant_id, p_dish_type_id, p_variation_id,
        p_photo_url, p_raw_score, v_initial_elo, p_notes
    )
    RETURNING id INTO v_new_rating_id;

    PERFORM public.calculate_user_credibility(v_user_id);

    -- Fetch credibility after it has been recalculated
    SELECT credibility_score INTO v_credibility
    FROM   public.profiles WHERE id = v_user_id;

    SELECT city_id, neighborhood_id
    INTO   v_city_id, v_neighborhood_id
    FROM   public.restaurants WHERE id = p_restaurant_id;

    -- Upsert global score record, adding this rating's weighted contribution
    -- to the running totals on conflict.
    INSERT INTO public.global_dish_scores (
        restaurant_id,   dish_type_id,    city_id,          neighborhood_id,
        weighted_elo_sum, weighted_raw_sum, total_weight,
        global_elo,       avg_raw_score,   total_ratings
    )
    VALUES (
        p_restaurant_id,              p_dish_type_id,              v_city_id,   v_neighborhood_id,
        v_initial_elo  * v_credibility,
        p_raw_score    * v_credibility,
        v_credibility,
        v_initial_elo,
        p_raw_score,
        1
    )
    ON CONFLICT (restaurant_id, dish_type_id) DO UPDATE
    SET
        weighted_elo_sum = global_dish_scores.weighted_elo_sum + (v_initial_elo * v_credibility),
        weighted_raw_sum = global_dish_scores.weighted_raw_sum + (p_raw_score   * v_credibility),
        total_weight     = global_dish_scores.total_weight     + v_credibility,
        global_elo       = ROUND(
                               (global_dish_scores.weighted_elo_sum + v_initial_elo * v_credibility)
                               / NULLIF(global_dish_scores.total_weight + v_credibility, 0),
                               2
                           ),
        avg_raw_score    = ROUND(
                               (global_dish_scores.weighted_raw_sum + p_raw_score * v_credibility)
                               / NULLIF(global_dish_scores.total_weight + v_credibility, 0),
                               1
                           ),
        total_ratings    = global_dish_scores.total_ratings + 1,
        updated_at       = now();

    -- Find duel candidate (unchanged)
    SELECT * INTO v_candidate
    FROM   public.find_comparison_candidate(v_user_id, p_dish_type_id, v_new_rating_id, v_initial_elo);

    IF v_candidate.candidate_rating_id IS NOT NULL THEN
        INSERT INTO public.comparisons (
            user_id, dish_type_id,
            rating_a_id,       rating_b_id,
            rating_a_elo_before, rating_b_elo_before
        )
        VALUES (
            v_user_id,         p_dish_type_id,
            v_new_rating_id,   v_candidate.candidate_rating_id,
            v_initial_elo,     v_candidate.candidate_elo
        )
        RETURNING id INTO v_comparison_id;

        RETURN json_build_object(
            'rating_id', v_new_rating_id,
            'has_duel',  true,
            'duel_data', json_build_object(
                'comparison_id',      v_comparison_id,
                'opponent_rating_id', v_candidate.candidate_rating_id,
                'opponent_name',      v_candidate.candidate_restaurant_name,
                'opponent_photo',     v_candidate.candidate_photo_url,
                'opponent_score',     v_candidate.candidate_score
            )
        );
    END IF;

    RETURN json_build_object(
        'rating_id', v_new_rating_id,
        'has_duel',  false
    );
END;
$$;
