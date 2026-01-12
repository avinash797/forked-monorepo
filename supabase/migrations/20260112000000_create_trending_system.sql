-- Create trending system for tracking dish rating performance over time
-- Purpose: Enable trending detection, historical charts, and performance analytics
-- This migration creates:
--   1. dish_rating_snapshots table for historical data
--   2. Trend columns on dishes table for fast reads
--   3. PostgreSQL functions for snapshot creation and trend calculation
--   4. pg_cron scheduling for automated daily snapshots

-- ============================================================================
-- PART 1: Create dish_rating_snapshots table
-- ============================================================================

create table public.dish_rating_snapshots (
  -- Snapshot ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Dish reference (required)
  dish_id uuid references public.dishes(id) on delete cascade not null,

  -- Snapshot data - captured at this point in time
  average_rating decimal(3, 1) check (average_rating >= 0 and average_rating <= 10),
  review_count integer not null default 0,
  elo_rating double precision,

  -- Time period this snapshot represents
  snapshot_date date not null default current_date,

  -- Calculated metrics at snapshot time
  rating_change_7d decimal(4, 2),  -- Rating change vs 7 days ago
  rating_change_30d decimal(4, 2), -- Rating change vs 30 days ago
  review_velocity_7d integer default 0, -- New reviews in last 7 days

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.dish_rating_snapshots enable row level security;

-- Policy: Everyone can view snapshots (public data for transparency)
create policy "Rating snapshots are viewable by everyone"
  on public.dish_rating_snapshots for select
  using (true);

-- Policy: Only service role can insert/update/delete (scheduled job)
-- Note: Service role bypasses RLS, so authenticated users cannot modify directly
create policy "Service role can manage snapshots"
  on public.dish_rating_snapshots for all
  to service_role
  using (true)
  with check (true);

-- Indexes for performance
-- Primary query pattern: get snapshots for a dish over time
create index dish_rating_snapshots_dish_id_idx
  on public.dish_rating_snapshots(dish_id);

-- Query pattern: get latest snapshot for a dish
create index dish_rating_snapshots_dish_date_idx
  on public.dish_rating_snapshots(dish_id, snapshot_date desc);

-- Query pattern: find trending dishes in a date range
create index dish_rating_snapshots_date_change_idx
  on public.dish_rating_snapshots(snapshot_date, rating_change_7d desc)
  where rating_change_7d is not null;

-- Unique constraint: one daily snapshot per dish
create unique index dish_rating_snapshots_dish_date_unique_idx
  on public.dish_rating_snapshots(dish_id, snapshot_date);

-- Add comments for documentation
comment on table public.dish_rating_snapshots is 'Historical rating snapshots for trend analysis and charting';
comment on column public.dish_rating_snapshots.snapshot_date is 'The date this snapshot represents';
comment on column public.dish_rating_snapshots.rating_change_7d is 'Change in average_rating compared to 7 days prior';
comment on column public.dish_rating_snapshots.rating_change_30d is 'Change in average_rating compared to 30 days prior';
comment on column public.dish_rating_snapshots.review_velocity_7d is 'Number of new reviews in the 7 days prior to snapshot';

-- ============================================================================
-- PART 2: Add trend columns to dishes table
-- ============================================================================

alter table public.dishes
  add column if not exists trend_direction text
    check (trend_direction in ('rising', 'falling', 'stable', 'new'))
    default 'new',
  add column if not exists trend_score decimal(6, 3) default 0,
  add column if not exists rating_change_7d decimal(4, 2),
  add column if not exists rating_change_30d decimal(4, 2),
  add column if not exists review_velocity_7d integer default 0,
  add column if not exists last_snapshot_at timestamp with time zone;

-- Index for trending queries
create index if not exists dishes_trending_idx
  on public.dishes(trend_direction, trend_score desc)
  where is_available = true and average_rating is not null;

-- Index for "rising" dishes specifically
create index if not exists dishes_rising_idx
  on public.dishes(trend_score desc)
  where trend_direction = 'rising' and is_available = true;

-- Add comments
comment on column public.dishes.trend_direction is 'Cached trend status: rising, falling, stable, or new';
comment on column public.dishes.trend_score is 'Composite score combining rating change and review velocity for ranking';
comment on column public.dishes.rating_change_7d is 'Cached rating change vs 7 days ago';
comment on column public.dishes.rating_change_30d is 'Cached rating change vs 30 days ago';
comment on column public.dishes.review_velocity_7d is 'Cached count of reviews in last 7 days';

-- ============================================================================
-- PART 3: Create helper functions
-- ============================================================================

-- Function to calculate trend direction based on rating changes and velocity
-- Returns: 'rising', 'falling', 'stable', or 'new'
create or replace function public.calculate_trend_direction(
  p_rating_change_7d decimal,
  p_review_velocity_7d integer,
  p_review_count integer,
  p_days_since_creation integer
)
returns text as $$
begin
  -- New dishes (less than 7 days old or no rating change data yet)
  if p_days_since_creation < 7 or p_rating_change_7d is null then
    return 'new';
  end if;

  -- Rising: positive rating change OR high review velocity with stable/positive rating
  if p_rating_change_7d >= 0.3 then
    return 'rising';
  elsif p_rating_change_7d >= 0 and p_review_velocity_7d >= 3 then
    return 'rising';
  end if;

  -- Falling: negative rating change
  if p_rating_change_7d <= -0.3 then
    return 'falling';
  end if;

  -- Otherwise stable
  return 'stable';
end;
$$ language plpgsql immutable;

-- Function to calculate composite trend score for ranking
-- Higher score = more "trending" (combination of rating change + activity)
create or replace function public.calculate_trend_score(
  p_rating_change_7d decimal,
  p_review_velocity_7d integer,
  p_average_rating decimal
)
returns decimal as $$
begin
  -- Weighted formula:
  -- - Rating change is primary factor (x10 weight)
  -- - Review velocity adds momentum (x0.5 weight per review)
  -- - Base rating provides a floor (x0.1 weight)
  return round((
    coalesce(p_rating_change_7d, 0) * 10 +
    coalesce(p_review_velocity_7d, 0) * 0.5 +
    coalesce(p_average_rating, 0) * 0.1
  )::numeric, 3);
end;
$$ language plpgsql immutable;

comment on function public.calculate_trend_direction is
  'Determines trend status based on rating changes and review velocity';
comment on function public.calculate_trend_score is
  'Calculates composite score for ranking trending dishes';

-- ============================================================================
-- PART 4: Create main functions for snapshot management
-- ============================================================================

-- Function to update trend columns on all dishes from latest snapshots
create or replace function public.update_dish_trends()
returns void as $$
begin
  update public.dishes d
  set
    trend_direction = public.calculate_trend_direction(
      latest.rating_change_7d,
      latest.review_velocity_7d,
      d.review_count,
      extract(day from (current_date - d.date_added::date))::integer
    ),
    trend_score = public.calculate_trend_score(
      latest.rating_change_7d,
      latest.review_velocity_7d,
      d.average_rating
    ),
    rating_change_7d = latest.rating_change_7d,
    rating_change_30d = latest.rating_change_30d,
    review_velocity_7d = latest.review_velocity_7d,
    last_snapshot_at = now()
  from (
    select distinct on (dish_id)
      dish_id,
      rating_change_7d,
      rating_change_30d,
      review_velocity_7d
    from public.dish_rating_snapshots
    order by dish_id, snapshot_date desc
  ) latest
  where d.id = latest.dish_id
    and d.is_available = true;
end;
$$ language plpgsql;

comment on function public.update_dish_trends is
  'Updates cached trend columns on dishes table from latest snapshots';

-- Function to create daily rating snapshots for all dishes
-- Called by pg_cron scheduler daily
create or replace function public.create_daily_rating_snapshots()
returns integer as $$
declare
  snapshot_count integer := 0;
  current_date_val date := current_date;
begin
  -- Insert snapshots for all dishes with ratings
  insert into public.dish_rating_snapshots (
    dish_id,
    average_rating,
    review_count,
    elo_rating,
    snapshot_date,
    rating_change_7d,
    rating_change_30d,
    review_velocity_7d
  )
  select
    d.id as dish_id,
    d.average_rating,
    d.review_count,
    d.elo_rating,
    current_date_val as snapshot_date,
    -- Calculate 7-day rating change
    case
      when prev_7d.average_rating is not null then
        round((d.average_rating - prev_7d.average_rating)::numeric, 2)
      else null
    end as rating_change_7d,
    -- Calculate 30-day rating change
    case
      when prev_30d.average_rating is not null then
        round((d.average_rating - prev_30d.average_rating)::numeric, 2)
      else null
    end as rating_change_30d,
    -- Calculate review velocity (reviews in last 7 days)
    coalesce(rv.review_count_7d, 0) as review_velocity_7d
  from public.dishes d
  -- Get 7-day-ago snapshot
  left join public.dish_rating_snapshots prev_7d
    on d.id = prev_7d.dish_id
    and prev_7d.snapshot_date = current_date_val - interval '7 days'
  -- Get 30-day-ago snapshot
  left join public.dish_rating_snapshots prev_30d
    on d.id = prev_30d.dish_id
    and prev_30d.snapshot_date = current_date_val - interval '30 days'
  -- Get review velocity
  left join (
    select
      dish_id,
      count(*) as review_count_7d
    from public.reviews
    where created_at >= (current_date_val - interval '7 days')
      and moderation_status = 'approved'
    group by dish_id
  ) rv on d.id = rv.dish_id
  where d.average_rating is not null
    and d.is_available = true
  -- Avoid duplicates for today (upsert)
  on conflict (dish_id, snapshot_date)
  do update set
    average_rating = excluded.average_rating,
    review_count = excluded.review_count,
    elo_rating = excluded.elo_rating,
    rating_change_7d = excluded.rating_change_7d,
    rating_change_30d = excluded.rating_change_30d,
    review_velocity_7d = excluded.review_velocity_7d;

  get diagnostics snapshot_count = row_count;

  -- Update trend direction on dishes table
  perform public.update_dish_trends();

  return snapshot_count;
end;
$$ language plpgsql security definer;

comment on function public.create_daily_rating_snapshots is
  'Creates daily rating snapshots for all dishes and updates trend indicators';

-- ============================================================================
-- PART 5: Create query functions for efficient data retrieval
-- ============================================================================

-- Function to get truly trending dishes (rising ratings)
-- Returns dishes ordered by trend_score with all necessary data
create or replace function public.get_trending_dishes(
  p_city text default null,
  p_direction text default 'rising',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  dish_id uuid,
  dish_name text,
  dish_category text,
  dish_variety text,
  average_rating decimal,
  review_count integer,
  current_price decimal,
  currency text,
  photos text[],
  trend_direction text,
  trend_score decimal,
  rating_change_7d decimal,
  rating_change_30d decimal,
  review_velocity_7d integer,
  venue_id uuid,
  venue_name text,
  venue_city text,
  venue_state text
) as $$
begin
  return query
  select
    d.id as dish_id,
    d.name as dish_name,
    d.category as dish_category,
    d.variety as dish_variety,
    d.average_rating,
    d.review_count,
    d.current_price,
    d.currency,
    d.photos,
    d.trend_direction,
    d.trend_score,
    d.rating_change_7d,
    d.rating_change_30d,
    d.review_velocity_7d,
    v.id as venue_id,
    v.name as venue_name,
    v.address_city as venue_city,
    v.address_state as venue_state
  from public.dishes d
  join public.venues v on d.venue_id = v.id
  where d.is_available = true
    and d.average_rating is not null
    and (p_direction = 'all' or d.trend_direction = p_direction)
    and (p_city is null or v.address_city ilike p_city)
  order by
    case when d.trend_direction = 'rising' then 0 else 1 end,
    d.trend_score desc,
    d.average_rating desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

comment on function public.get_trending_dishes is
  'Fetches truly trending dishes with venue info, filterable by city and direction';

-- Function to get rating history for a dish (for charting)
create or replace function public.get_dish_rating_history(
  p_dish_id uuid,
  p_days integer default 30
)
returns table (
  snapshot_date date,
  average_rating decimal,
  review_count integer,
  rating_change_7d decimal,
  review_velocity_7d integer
) as $$
begin
  return query
  select
    s.snapshot_date,
    s.average_rating,
    s.review_count,
    s.rating_change_7d,
    s.review_velocity_7d
  from public.dish_rating_snapshots s
  where s.dish_id = p_dish_id
    and s.snapshot_date >= current_date - (p_days || ' days')::interval
  order by s.snapshot_date asc;
end;
$$ language plpgsql stable;

comment on function public.get_dish_rating_history is
  'Returns rating snapshots for a dish over time, for charting purposes';

-- ============================================================================
-- PART 6: pg_cron scheduling (MANUAL SETUP REQUIRED)
-- ============================================================================

-- NOTE: pg_cron scheduling must be set up manually after enabling the extension.
--
-- To enable pg_cron on Supabase:
-- 1. Go to your Supabase Dashboard > Database > Extensions
-- 2. Search for "pg_cron" and enable it
-- 3. Then run these commands manually in SQL Editor:
--
--    -- Schedule daily snapshot job at 3 AM UTC
--    SELECT cron.schedule(
--      'daily-rating-snapshots',
--      '0 3 * * *',
--      'SELECT public.create_daily_rating_snapshots()'
--    );
--
--    -- Schedule trend updates every 6 hours
--    SELECT cron.schedule(
--      'frequent-trend-updates',
--      '0 */6 * * *',
--      'SELECT public.update_dish_trends()'
--    );
--
-- To view scheduled jobs: SELECT * FROM cron.job;
-- To remove a job: SELECT cron.unschedule('job-name');

-- ============================================================================
-- PART 7: Create initial snapshots for existing dishes
-- ============================================================================

-- Run initial snapshot creation to populate data for existing dishes
select public.create_daily_rating_snapshots();
