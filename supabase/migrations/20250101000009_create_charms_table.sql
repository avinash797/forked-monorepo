-- Create charms/badges table for gamification
-- Charms are achievements/badges users can earn based on their activity

create table public.charms (
  -- Charm ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Name (e.g., "The OG", "Taco King", "Seafood Connoisseur")
  name text not null unique,

  -- Description
  description text not null,

  -- Icon/image URL
  icon_url text,

  -- SVG icon (alternative to icon_url, stored inline)
  icon_svg text,

  -- Unlock criteria (JSON defining requirements)
  -- Examples:
  -- {"type": "review_count", "value": 100}
  -- {"type": "specific_dish_type", "dish_type_id": "uuid", "min_reviews": 10}
  -- {"type": "location_explorer", "min_venues": 50, "min_cities": 5}
  -- {"type": "early_adopter", "join_before": "2025-12-31"}
  unlock_criteria jsonb not null,

  -- Rarity tier
  rarity_tier text not null check (
    rarity_tier in ('common', 'uncommon', 'rare', 'epic', 'legendary')
  ),

  -- Display order (for showing charms in UI)
  display_order integer default 0 not null,

  -- Whether this charm is currently active/available to earn
  is_active boolean default true not null,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.charms enable row level security;

-- Policy: Everyone can view active charms
create policy "Active charms are viewable by everyone"
  on public.charms for select
  using (is_active = true);

-- Policy: Only admins can create/update/delete charms
-- (For now, we'll allow authenticated users - tighten this later with admin role)
create policy "Admins can manage charms"
  on public.charms for all
  to authenticated
  using (true)
  with check (true);

-- Function to update updated_at timestamp
create or replace function public.handle_charms_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger on_charm_updated
  before update on public.charms
  for each row execute procedure public.handle_charms_updated_at();

-- Indexes for performance
create index charms_rarity_tier_idx on public.charms(rarity_tier);
create index charms_display_order_idx on public.charms(display_order);
create index charms_is_active_idx on public.charms(is_active) where is_active = true;

-- Add comments for documentation
comment on table public.charms is 'Achievements/badges users can earn through app activity';
comment on column public.charms.unlock_criteria is 'JSONB defining requirements to unlock this charm';
comment on column public.charms.rarity_tier is 'Rarity: common, uncommon, rare, epic, legendary';

-- Insert example charms
insert into public.charms (name, description, icon_url, unlock_criteria, rarity_tier, display_order) values
  (
    'The OG',
    'Early adopter who joined in the first month',
    null,
    '{"type": "early_adopter", "join_before": "2025-02-01"}'::jsonb,
    'legendary',
    1
  ),
  (
    'First Review',
    'Posted your first review',
    null,
    '{"type": "review_count", "min_count": 1}'::jsonb,
    'common',
    2
  ),
  (
    'Review Veteran',
    'Posted 100 reviews',
    null,
    '{"type": "review_count", "min_count": 100}'::jsonb,
    'epic',
    3
  ),
  (
    'Taco King',
    'Reviewed 20+ tacos',
    null,
    '{"type": "dish_type_reviews", "dish_type_name": "Taco", "min_count": 20}'::jsonb,
    'rare',
    4
  ),
  (
    'Seafood Connoisseur',
    'Reviewed 30+ seafood dishes',
    null,
    '{"type": "cuisine_reviews", "cuisine_type": "Seafood", "min_count": 30}'::jsonb,
    'rare',
    5
  ),
  (
    'City Explorer',
    'Reviewed venues in 10+ different cities',
    null,
    '{"type": "location_explorer", "min_cities": 10}'::jsonb,
    'epic',
    6
  ),
  (
    'Helpful Reviewer',
    'Received 100+ helpful votes on reviews',
    null,
    '{"type": "helpful_votes_received", "min_count": 100}'::jsonb,
    'rare',
    7
  ),
  (
    'Photographer',
    'Uploaded 50+ photos',
    null,
    '{"type": "photos_uploaded", "min_count": 50}'::jsonb,
    'uncommon',
    8
  ),
  (
    '5-Star Finder',
    'Found 20 dishes worth 5 stars',
    null,
    '{"type": "five_star_reviews", "min_count": 20}'::jsonb,
    'rare',
    9
  ),
  (
    'Price Detective',
    'Reported 50+ accurate prices',
    null,
    '{"type": "price_reports_verified", "min_count": 50}'::jsonb,
    'uncommon',
    10
  );
