-- Migration: Create leaderboard_snapshots table
-- Daily snapshots of leaderboard positions for historical tracking
-- Enables: "+/- positions since last week", "Best Burger spot of 2026", etc.

CREATE TABLE public.leaderboard_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    global_dish_score_id uuid NOT NULL REFERENCES public.global_dish_scores(id),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id),
    dish_type_id uuid NOT NULL REFERENCES public.dish_types(id),
    city_id uuid NOT NULL REFERENCES public.cities(id),
    neighborhood_id uuid REFERENCES public.neighborhoods(id),
    rank_position integer NOT NULL,
    global_elo numeric NOT NULL,
    avg_raw_score numeric,
    total_ratings integer DEFAULT 0,
    total_battles integer DEFAULT 0,
    battles_won integer DEFAULT 0,
    win_rate numeric,
    confidence_score numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT leaderboard_snapshots_pkey PRIMARY KEY (id),
    CONSTRAINT leaderboard_snapshots_date_score_unique UNIQUE (snapshot_date, global_dish_score_id)
);

COMMENT ON TABLE public.leaderboard_snapshots
  IS 'Daily snapshots of leaderboard positions for historical tracking and stats';

-- Index for leaderboard history queries (e.g., rank changes for a city+dish over time)
CREATE INDEX idx_leaderboard_snapshots_city_dish_date
  ON public.leaderboard_snapshots (city_id, dish_type_id, snapshot_date);

-- Index for date-range queries and cleanup
CREATE INDEX idx_leaderboard_snapshots_date
  ON public.leaderboard_snapshots (snapshot_date);

-- Index for looking up a specific restaurant's rank history
CREATE INDEX idx_leaderboard_snapshots_restaurant
  ON public.leaderboard_snapshots (restaurant_id, dish_type_id, snapshot_date);

-- Enable RLS
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Leaderboard snapshots are publicly readable"
  ON public.leaderboard_snapshots
  FOR SELECT
  TO authenticated, anon
  USING (true);
