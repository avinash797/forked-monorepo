-- Create venues (restaurants) table
create table public.venues (
  -- Venue ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Basic Info
  name text not null,

  -- Address (structured)
  address_street text not null,
  address_city text not null,
  address_state text not null,
  address_zip text not null,
  address_country text not null default 'USA',

  -- Coordinates for location verification and mapping
  latitude decimal(10, 8),
  longitude decimal(11, 8),

  -- Cuisine types (array)
  cuisine_types text[] not null default '{}',

  -- Chain information
  is_chain boolean default false not null,
  parent_chain_id uuid references public.venues(id) on delete set null,

  -- Hours of operation (JSONB for flexibility)
  -- Format: { "monday": { "open": "09:00", "close": "22:00" }, ... }
  hours_of_operation jsonb default '{}'::jsonb not null,

  -- Price range (1-4 representing $ to $$$$)
  price_range integer check (price_range >= 1 and price_range <= 4),

  -- Photos (array of URLs)
  photos text[] default '{}',

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Added by user (optional tracking)
  added_by_user_id uuid references auth.users(id) on delete set null
);

-- Enable Row Level Security
alter table public.venues enable row level security;

-- Policy: Everyone can view venues (public data)
create policy "Venues are viewable by everyone"
  on public.venues for select
  using (true);

-- Policy: Authenticated users can insert venues
create policy "Authenticated users can create venues"
  on public.venues for insert
  to authenticated
  with check (true);

-- Policy: Users can update venues they added OR admins can update any
-- (For now, any authenticated user can update - can be restricted later)
create policy "Users can update venues"
  on public.venues for update
  to authenticated
  using (true);

-- Policy: Only venue creator or admin can delete
create policy "Users can delete venues they created"
  on public.venues for delete
  to authenticated
  using (added_by_user_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function public.handle_venues_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger on_venue_updated
  before update on public.venues
  for each row execute procedure public.handle_venues_updated_at();

-- Indexes for performance
create index venues_name_idx on public.venues(name);
create index venues_city_idx on public.venues(address_city);
create index venues_cuisine_idx on public.venues using gin(cuisine_types);
create index venues_location_idx on public.venues(latitude, longitude);
create index venues_parent_chain_idx on public.venues(parent_chain_id) where parent_chain_id is not null;
create index venues_created_at_idx on public.venues(created_at desc);

-- Add comments for documentation
comment on table public.venues is 'Restaurants and dining venues';
comment on column public.venues.cuisine_types is 'Array of cuisine types (e.g., ["Creole", "Seafood"])';
comment on column public.venues.hours_of_operation is 'JSONB object with days as keys and open/close times';
comment on column public.venues.price_range is 'Price range from 1 ($) to 4 ($$$$)';
comment on column public.venues.photos is 'Array of photo URLs for venue exterior/interior';
