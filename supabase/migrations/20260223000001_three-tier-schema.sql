-- =============================================================================
-- Migration: Three-Tier Rating System — Schema Changes
--
-- This migration transitions personal_ratings, comparisons, and global_dish_scores
-- from the Elo-based system to the three-tier sentiment + binary insertion sort system.
--
-- Apply order: 1 of 3 (schema) → 2 of 3 (RPCs) → 3 of 3 (drop old functions)
-- =============================================================================

BEGIN;

-- ============================================
-- 1. ALTER personal_ratings
-- ============================================

-- Add new columns (nullable first, for backfill)
ALTER TABLE public.personal_ratings
    ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('liked','okay','disliked')),
    ADD COLUMN IF NOT EXISTS derived_score NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS rank_position INTEGER;

-- Update update_featured_photo trigger BEFORE dropping raw_score.
-- Changes ORDER BY from raw_score DESC → derived_score DESC NULLS LAST.
CREATE OR REPLACE FUNCTION public.update_featured_photo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    UPDATE public.global_dish_scores gds
    SET featured_photo_url = (
            SELECT pr.photo_url
            FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC
            LIMIT 1
        ),
        featured_rating_id = (
            SELECT pr.id
            FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC
            LIMIT 1
        )
    WHERE gds.restaurant_id = NEW.restaurant_id
      AND gds.dish_type_id  = NEW.dish_type_id;
    RETURN NEW;
END;
$$;

-- Backfill sentiment from raw_score
UPDATE public.personal_ratings
SET sentiment = CASE
    WHEN raw_score >= 7 THEN 'liked'
    WHEN raw_score >= 4 THEN 'okay'
    ELSE                     'disliked'
END
WHERE sentiment IS NULL;

-- Backfill rank_position: sentiment-grouped, then by personal_elo DESC within each group
-- liked zone (positions 1..N_liked) → okay zone → disliked zone
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, dish_type_id
            ORDER BY
                CASE sentiment
                    WHEN 'liked'    THEN 0
                    WHEN 'okay'     THEN 1
                    ELSE                 2
                END,
                personal_elo DESC
        ) AS rn
    FROM public.personal_ratings
)
UPDATE public.personal_ratings pr
SET rank_position = ranked.rn
FROM ranked
WHERE pr.id = ranked.id;

-- Backfill derived_score from raw_score (temporary approximation; correct values
-- are recomputed when the first battle in the new system completes)
UPDATE public.personal_ratings
SET derived_score = raw_score::NUMERIC
WHERE derived_score IS NULL;

-- Now set NOT NULL constraint on sentiment
ALTER TABLE public.personal_ratings
    ALTER COLUMN sentiment SET NOT NULL,
    ALTER COLUMN sentiment SET DEFAULT 'liked';

-- Drop old Elo/battle columns
ALTER TABLE public.personal_ratings
    DROP COLUMN IF EXISTS raw_score,
    DROP COLUMN IF EXISTS personal_elo,
    DROP COLUMN IF EXISTS battles_won,
    DROP COLUMN IF EXISTS battles_lost,
    DROP COLUMN IF EXISTS battles_total;

-- Replace idx_ratings_user_elo with two new indexes
DROP INDEX IF EXISTS public.idx_ratings_user_elo;

CREATE INDEX IF NOT EXISTS idx_ratings_user_dish_sentiment
    ON public.personal_ratings (user_id, dish_type_id, sentiment);

CREATE INDEX IF NOT EXISTS idx_ratings_user_dish_rank
    ON public.personal_ratings (user_id, dish_type_id, rank_position ASC);


-- ============================================
-- 2. ALTER comparisons
-- ============================================

-- Add new columns
ALTER TABLE public.comparisons
    ADD COLUMN IF NOT EXISTS new_rating_id      UUID REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS opponent_rating_id UUID REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS result             TEXT CHECK (result IN ('new_wins','opponent_wins','skipped')),
    ADD COLUMN IF NOT EXISTS step_number        INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS low_bound          INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS high_bound         INTEGER NOT NULL DEFAULT 0;

-- Backfill new_rating_id / opponent_rating_id from legacy columns
UPDATE public.comparisons
SET new_rating_id      = rating_a_id,
    opponent_rating_id = rating_b_id
WHERE rating_a_id IS NOT NULL
  AND new_rating_id IS NULL;

-- Backfill result from legacy winner_rating_id / skipped
UPDATE public.comparisons
SET result = CASE
    WHEN skipped = true                                             THEN 'skipped'
    WHEN winner_rating_id IS NOT NULL AND winner_rating_id = rating_a_id THEN 'new_wins'
    WHEN winner_rating_id IS NOT NULL AND winner_rating_id = rating_b_id THEN 'opponent_wins'
    ELSE NULL  -- unresolved / in-progress
END
WHERE result IS NULL;

-- Drop unique constraint that prevented re-battling the same pair
ALTER TABLE public.comparisons
    DROP CONSTRAINT IF EXISTS comparisons_user_id_rating_a_id_rating_b_id_key;

-- Drop old CHECK constraint on skip_reason (values are now free text)
ALTER TABLE public.comparisons
    DROP CONSTRAINT IF EXISTS comparisons_skip_reason_check;

-- Drop legacy Elo columns
ALTER TABLE public.comparisons
    DROP COLUMN IF EXISTS rating_a_id,
    DROP COLUMN IF EXISTS rating_b_id,
    DROP COLUMN IF EXISTS winner_rating_id,
    DROP COLUMN IF EXISTS skipped,
    DROP COLUMN IF EXISTS rating_a_elo_before,
    DROP COLUMN IF EXISTS rating_a_elo_after,
    DROP COLUMN IF EXISTS rating_b_elo_before,
    DROP COLUMN IF EXISTS rating_b_elo_after;

-- Index for looking up the active battle for a new rating
CREATE INDEX IF NOT EXISTS idx_comparisons_active_battle
    ON public.comparisons (new_rating_id)
    WHERE result IS NULL;


-- ============================================
-- 3. ALTER global_dish_scores
-- ============================================

-- Add new columns
ALTER TABLE public.global_dish_scores
    ADD COLUMN IF NOT EXISTS bayesian_score  NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS confidence_tier TEXT DEFAULT 'low'
        CHECK (confidence_tier IN ('low','medium','high','very_high'));

-- Rename running-total columns to new semantics
-- avg_raw_score   → raw_weighted_avg     (Σ derived_score / N)
-- total_weight    → weighted_rating_count (= total_ratings in v0.1; all photos mandatory)
-- weighted_raw_sum → weighted_score_sum   (Σ derived_score)
ALTER TABLE public.global_dish_scores
    RENAME COLUMN avg_raw_score    TO raw_weighted_avg;
ALTER TABLE public.global_dish_scores
    RENAME COLUMN total_weight     TO weighted_rating_count;
ALTER TABLE public.global_dish_scores
    RENAME COLUMN weighted_raw_sum TO weighted_score_sum;

-- Backfill bayesian_score (approximate: use raw_weighted_avg if available, else 5.0)
UPDATE public.global_dish_scores
SET bayesian_score = COALESCE(raw_weighted_avg, 5.0)
WHERE bayesian_score IS NULL;

-- Backfill confidence_tier from weighted_rating_count (C = 5)
-- <5 → low, 5–9 → medium, 10–24 → high, ≥25 → very_high
UPDATE public.global_dish_scores
SET confidence_tier = CASE
    WHEN COALESCE(weighted_rating_count, 0) >= 25 THEN 'very_high'
    WHEN COALESCE(weighted_rating_count, 0) >= 10 THEN 'high'
    WHEN COALESCE(weighted_rating_count, 0) >= 5  THEN 'medium'
    ELSE                                               'low'
END
WHERE confidence_tier = 'low' OR confidence_tier IS NULL;

-- Drop legacy Elo / battle columns
ALTER TABLE public.global_dish_scores
    DROP COLUMN IF EXISTS global_elo,
    DROP COLUMN IF EXISTS weighted_elo_sum,
    DROP COLUMN IF EXISTS total_battles,
    DROP COLUMN IF EXISTS battles_won,
    DROP COLUMN IF EXISTS win_rate,
    DROP COLUMN IF EXISTS confidence_score;

-- Drop and recreate indexes using bayesian_score
DROP INDEX IF EXISTS public.idx_global_scores_leaderboard;
DROP INDEX IF EXISTS public.idx_global_scores_neighborhood;
DROP INDEX IF EXISTS public.idx_global_scores_confidence;

CREATE INDEX idx_global_scores_leaderboard
    ON public.global_dish_scores (city_id, dish_type_id, bayesian_score DESC);

CREATE INDEX idx_global_scores_neighborhood
    ON public.global_dish_scores (neighborhood_id, dish_type_id, bayesian_score DESC)
    WHERE neighborhood_id IS NOT NULL;

COMMIT;
