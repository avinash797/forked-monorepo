-- Create dish_types table for normalization
-- Purpose: Allow efficient queries like "all Gumbos in New Orleans"
-- A dish at a venue references a dish type (e.g., "Gumbo at Restaurant A" references the "Gumbo" type)

create table public.dish_types (
  -- Dish Type ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Name of the dish type (e.g., "Gumbo", "Lobster Roll")
  name text not null,

  -- Category (same as dishes.category for consistency)
  category text not null,

  -- Description of this dish type
  description text,

  -- Alternate names/spellings for search
  alternate_names text[] default '{}',

  -- Common dietary tags for this dish type
  common_dietary_tags text[] default '{}',

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Created by user (optional tracking)
  created_by_user_id uuid references auth.users(id) on delete set null
);

-- Enable Row Level Security
alter table public.dish_types enable row level security;

-- Policy: Everyone can view dish types (public data)
create policy "Dish types are viewable by everyone"
  on public.dish_types for select
  using (true);

-- Policy: Authenticated users can create dish types
create policy "Authenticated users can create dish types"
  on public.dish_types for insert
  to authenticated
  with check (true);

-- Policy: Authenticated users can update dish types
create policy "Users can update dish types"
  on public.dish_types for update
  to authenticated
  using (true);

-- Policy: Only creator or admin can delete (for now, any authenticated user)
create policy "Authenticated users can delete dish types"
  on public.dish_types for delete
  to authenticated
  using (true);

-- Function to update updated_at timestamp
create or replace function public.handle_dish_types_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger on_dish_type_updated
  before update on public.dish_types
  for each row execute procedure public.handle_dish_types_updated_at();

-- Indexes for performance
create index dish_types_name_idx on public.dish_types(name);
create index dish_types_category_idx on public.dish_types(category);
create index dish_types_alternate_names_idx on public.dish_types using gin(alternate_names);

-- Unique constraint on name + category to prevent duplicates
create unique index dish_types_name_category_unique_idx on public.dish_types(lower(name), category);

-- Add comments for documentation
comment on table public.dish_types is 'Normalized dish type definitions for cross-venue queries';
comment on column public.dish_types.name is 'Canonical name of the dish type (e.g., "Gumbo")';
comment on column public.dish_types.alternate_names is 'Array of alternate names/spellings for search';
comment on column public.dish_types.common_dietary_tags is 'Common dietary tags typically associated with this dish type';

-- Insert some common dish types as examples
insert into public.dish_types (name, category, description, common_dietary_tags) values
  ('Gumbo', 'entree', 'A hearty Louisiana stew typically made with a roux base, the "holy trinity" of vegetables, and various proteins', array['spicy']::text[]),
  ('Lobster Roll', 'entree', 'A New England sandwich filled with lobster meat, typically served in a grilled hot dog-style bun', array['seafood']::text[]),
  ('Caesar Salad', 'appetizer', 'Classic salad with romaine lettuce, parmesan cheese, croutons, and Caesar dressing', array[]::text[]),
  ('French Fries', 'side', 'Deep-fried potato strips', array['vegan', 'vegetarian']::text[]);
