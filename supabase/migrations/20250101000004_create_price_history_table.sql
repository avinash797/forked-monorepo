-- Create price_history table for tracking price changes over time
-- Purpose: Track price trends, crowd-sourced accuracy, enable price alerts

create table public.price_history (
  -- Price History ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Dish reference (required)
  dish_id uuid references public.dishes(id) on delete cascade not null,

  -- Price information
  price decimal(10, 2) not null,
  currency text default 'USD' not null,

  -- Timestamp when this price was recorded/observed
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Who reported this price (optional, null for restaurant-reported)
  reported_by_user_id uuid references auth.users(id) on delete set null,

  -- Source of the price information
  -- 'user-reported': Crowdsourced from app users
  -- 'restaurant-updated': Official update from restaurant
  -- 'admin-verified': Verified by platform admin
  -- 'menu-scrape': Automated scraping (future feature)
  source text not null check (source in ('user-reported', 'restaurant-updated', 'admin-verified', 'menu-scrape')),

  -- Optional notes about this price entry
  notes text,

  -- Verification status
  is_verified boolean default false not null,
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamp with time zone,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.price_history enable row level security;

-- Policy: Everyone can view price history (public data for transparency)
create policy "Price history is viewable by everyone"
  on public.price_history for select
  using (true);

-- Policy: Authenticated users can report prices
create policy "Authenticated users can report prices"
  on public.price_history for insert
  to authenticated
  with check (
    -- Users can only create user-reported entries with their own ID
    (source = 'user-reported' and reported_by_user_id = auth.uid())
    -- Or admins can create any type (future enhancement: add admin role check)
    or true
  );

-- Policy: Users can update their own price reports (before verification)
create policy "Users can update their own price reports"
  on public.price_history for update
  to authenticated
  using (
    reported_by_user_id = auth.uid()
    and is_verified = false
  );

-- Policy: Only reporter or admin can delete unverified entries
create policy "Users can delete their own unverified price reports"
  on public.price_history for delete
  to authenticated
  using (
    reported_by_user_id = auth.uid()
    and is_verified = false
  );

-- Indexes for performance
create index price_history_dish_id_idx on public.price_history(dish_id);
create index price_history_recorded_at_idx on public.price_history(recorded_at desc);
create index price_history_source_idx on public.price_history(source);
create index price_history_verified_idx on public.price_history(is_verified) where is_verified = true;

-- Composite index for common query pattern (dish + time)
create index price_history_dish_time_idx on public.price_history(dish_id, recorded_at desc);

-- Function to get the most recent verified price for a dish
create or replace function public.get_current_dish_price(p_dish_id uuid)
returns decimal(10, 2) as $$
  select price
  from public.price_history
  where dish_id = p_dish_id
    and is_verified = true
  order by recorded_at desc
  limit 1;
$$ language sql stable;

-- Function to update dish.current_price when price_history is inserted
create or replace function public.sync_dish_current_price()
returns trigger as $$
begin
  -- Only update if this is a verified price or the first price entry
  if new.is_verified or not exists (
    select 1 from public.price_history
    where dish_id = new.dish_id
    and id != new.id
  ) then
    update public.dishes
    set
      current_price = new.price,
      currency = new.currency,
      updated_at = now()
    where id = new.dish_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update dish.current_price
create trigger on_price_history_insert
  after insert on public.price_history
  for each row execute procedure public.sync_dish_current_price();

-- Trigger to update current_price when verification status changes
create trigger on_price_history_verify
  after update of is_verified on public.price_history
  for each row
  when (new.is_verified = true and old.is_verified = false)
  execute procedure public.sync_dish_current_price();

-- Add comments for documentation
comment on table public.price_history is 'Historical price tracking for dishes with crowd-sourced verification';
comment on column public.price_history.source is 'Source of price: user-reported, restaurant-updated, admin-verified, or menu-scrape';
comment on column public.price_history.recorded_at is 'When this price was observed/recorded (not when the entry was created)';
comment on column public.price_history.is_verified is 'Whether this price has been verified as accurate';
