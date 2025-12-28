-- Create dishes table
create table public.dishes (
  -- Dish ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Venue relationship (required)
  venue_id uuid references public.venues(id) on delete cascade not null,

  -- Dish information
  name text not null,

  -- Category (appetizer, entree, dessert, etc.)
  category text not null,

  -- Variety/specification (optional: "Seafood", "Chicken & Sausage", "Vegan")
  variety text,

  -- Current price (cached value for quick access)
  current_price decimal(10, 2),

  -- Currency (default USD)
  currency text default 'USD' not null,

  -- Description (optional, from restaurant)
  description text,

  -- Dietary tags (vegetarian, vegan, gluten-free, etc.)
  dietary_tags text[] default '{}',

  -- Spice level (0-5, where 0 is not spicy)
  spice_level integer check (spice_level >= 0 and spice_level <= 5) default 0,

  -- Photos of the dish
  photos text[] default '{}',

  -- Availability status
  is_available boolean default true not null,

  -- Metadata
  date_added timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Added by user (optional tracking)
  added_by_user_id uuid references auth.users(id) on delete set null
);

-- Enable Row Level Security
alter table public.dishes enable row level security;

-- Policy: Everyone can view available dishes (public data)
create policy "Dishes are viewable by everyone"
  on public.dishes for select
  using (true);

-- Policy: Authenticated users can insert dishes
create policy "Authenticated users can create dishes"
  on public.dishes for insert
  to authenticated
  with check (true);

-- Policy: Authenticated users can update dishes
create policy "Users can update dishes"
  on public.dishes for update
  to authenticated
  using (true);

-- Policy: Only dish creator or admin can delete
create policy "Users can delete dishes they created"
  on public.dishes for delete
  to authenticated
  using (added_by_user_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function public.handle_dishes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger on_dish_updated
  before update on public.dishes
  for each row execute procedure public.handle_dishes_updated_at();

-- Indexes for performance
create index dishes_venue_id_idx on public.dishes(venue_id);
create index dishes_name_idx on public.dishes(name);
create index dishes_category_idx on public.dishes(category);
create index dishes_dietary_tags_idx on public.dishes using gin(dietary_tags);
create index dishes_date_added_idx on public.dishes(date_added desc);
create index dishes_availability_idx on public.dishes(is_available) where is_available = true;

-- Composite index for common queries (venue + availability)
create index dishes_venue_available_idx on public.dishes(venue_id, is_available);

-- Add comments for documentation
comment on table public.dishes is 'Dishes available at venues';
comment on column public.dishes.category is 'Dish category (appetizer, entree, dessert, beverage, etc.)';
comment on column public.dishes.variety is 'Optional variety/specification (e.g., "Seafood", "Vegan")';
comment on column public.dishes.current_price is 'Current price of the dish (cached for quick access)';
comment on column public.dishes.dietary_tags is 'Array of dietary tags (e.g., ["vegetarian", "gluten-free"])';
comment on column public.dishes.spice_level is 'Spiciness level from 0 (not spicy) to 5 (very spicy)';
comment on column public.dishes.is_available is 'Whether the dish is currently available at the venue';
