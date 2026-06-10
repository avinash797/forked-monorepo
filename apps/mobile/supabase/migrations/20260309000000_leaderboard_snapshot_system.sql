-- ============================================================
-- LEADERBOARD SNAPSHOT SYSTEM
-- Enables historical rank tracking for marketing, SEO, and
-- in-app "↑5 this week" trend badges on leaderboard rows.
-- ============================================================

-- 1. Enable pg_cron for scheduled daily snapshots
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Add scope column to distinguish city vs. neighborhood rankings.
--    A single global_dish_score_id can appear in both scopes with
--    different rank_positions, so scope must be part of the unique key.
ALTER TABLE public.leaderboard_snapshots
    ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'city'
        CHECK (scope IN ('city', 'neighborhood'));

-- 3. Replace the old unique constraint with one that includes scope
ALTER TABLE public.leaderboard_snapshots
    DROP CONSTRAINT IF EXISTS leaderboard_snapshots_snapshot_date_global_dish_score_id_key;

ALTER TABLE public.leaderboard_snapshots
    ADD CONSTRAINT leaderboard_snapshots_date_score_scope_key
        UNIQUE (snapshot_date, global_dish_score_id, scope);

-- ============================================================
-- FUNCTION: take_leaderboard_snapshot
-- Called daily by pg_cron. Captures current global_dish_scores
-- with computed rank positions for both city and neighborhood scopes.
-- Returns the number of rows inserted.
-- ============================================================
CREATE OR REPLACE FUNCTION public.take_leaderboard_snapshot(
    p_snapshot_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_inserted INTEGER := 0;
    v_batch    INTEGER;
BEGIN
    -- City-level: rank within (city_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        NULL,
        RANK() OVER (
            PARTITION BY gds.city_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'city'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= 2
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    -- Neighborhood-level: rank within (neighborhood_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        RANK() OVER (
            PARTITION BY gds.neighborhood_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'neighborhood'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= 2
      AND gds.neighborhood_id IS NOT NULL
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    RETURN v_inserted;
END;
$$;

-- ============================================================
-- RPC: get_rank_history
-- Returns the rank and score trajectory for a restaurant+dish
-- over the last N days. Use for charts and blog content.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_rank_history(
    p_restaurant_id UUID,
    p_dish_type_id  UUID,
    p_city_id       UUID,
    p_days          INTEGER DEFAULT 30,
    p_scope         TEXT    DEFAULT 'city'
) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_results JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'snapshot_date',  snapshot_date,
            'rank_position',  rank_position,
            'bayesian_score', FLOOR(bayesian_score * 10) / 10,
            'total_ratings',  total_ratings,
            'confidence_tier', confidence_tier
        )
        ORDER BY snapshot_date ASC
    )
    INTO v_results
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date >= CURRENT_DATE - p_days;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- ============================================================
-- RPC: get_rank_delta
-- Returns rank change between now and a past period.
-- Powers the "↑5 this week" badge on leaderboard rows.
-- rank_delta > 0 means climbed, < 0 means fell, null means new.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_rank_delta(
    p_restaurant_id UUID,
    p_dish_type_id  UUID,
    p_city_id       UUID,
    p_period        TEXT DEFAULT 'week',  -- 'day' | 'week' | 'month' | 'year'
    p_scope         TEXT DEFAULT 'city'
) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_days          INTEGER;
    v_current_rank  INTEGER;
    v_past_rank     INTEGER;
    v_current_score NUMERIC;
    v_past_score    NUMERIC;
BEGIN
    v_days := CASE p_period
        WHEN 'day'   THEN 1
        WHEN 'week'  THEN 7
        WHEN 'month' THEN 30
        WHEN 'year'  THEN 365
        ELSE 7
    END;

    -- Most recent snapshot
    SELECT rank_position, bayesian_score
    INTO v_current_rank, v_current_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Closest snapshot at or before the period boundary
    SELECT rank_position, bayesian_score
    INTO v_past_rank, v_past_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date <= CURRENT_DATE - v_days
    ORDER BY snapshot_date DESC
    LIMIT 1;

    IF v_current_rank IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'current_rank',  v_current_rank,
        'past_rank',     v_past_rank,
        'rank_delta',    CASE WHEN v_past_rank IS NOT NULL
                              THEN v_past_rank - v_current_rank
                              ELSE NULL END,
        'current_score', ROUND(v_current_score, 1),
        'past_score',    CASE WHEN v_past_score IS NOT NULL
                              THEN ROUND(v_past_score, 1)
                              ELSE NULL END,
        'period',        p_period,
        'trend',         CASE
                           WHEN v_past_rank IS NULL              THEN 'new'
                           WHEN v_past_rank > v_current_rank     THEN 'up'
                           WHEN v_past_rank < v_current_rank     THEN 'down'
                           ELSE 'stable'
                         END
    );
END;
$$;

-- ============================================================
-- SCHEDULE: daily snapshot at 3:00 AM UTC via pg_cron
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-leaderboard-snapshot') THEN
        PERFORM cron.unschedule('daily-leaderboard-snapshot');
    END IF;
END;
$$;

SELECT cron.schedule(
    'daily-leaderboard-snapshot',
    '0 3 * * *',
    $$SELECT public.take_leaderboard_snapshot()$$
);

-- ============================================================
-- BACKFILL: seed today's snapshot immediately so queries
-- return data from day one rather than waiting until 3 AM.
-- ============================================================
SELECT public.take_leaderboard_snapshot(CURRENT_DATE);
