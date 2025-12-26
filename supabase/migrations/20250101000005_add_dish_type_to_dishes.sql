-- Add dish_type_id foreign key to dishes table
-- This links specific venue dishes to normalized dish types
-- Example: "Gumbo at Restaurant A" -> references "Gumbo" dish type

-- Add the foreign key column (nullable initially for backward compatibility)
alter table public.dishes
add column dish_type_id uuid references public.dish_types(id) on delete set null;

-- Create index for the foreign key
create index dishes_dish_type_id_idx on public.dishes(dish_type_id);

-- Composite index for common query pattern (dish_type + venue)
-- Enables efficient queries like "all Gumbos in this city"
create index dishes_type_venue_idx on public.dishes(dish_type_id, venue_id);

-- Add comment
comment on column public.dishes.dish_type_id is 'Reference to normalized dish type for cross-venue queries';

-- Optional: Create a helper function to find all instances of a dish type across venues
create or replace function public.find_dishes_by_type(
  p_dish_type_id uuid,
  p_city text default null,
  p_limit integer default 100
)
returns table (
  dish_id uuid,
  dish_name text,
  venue_id uuid,
  venue_name text,
  venue_city text,
  current_price decimal,
  currency text,
  is_available boolean
) as $$
begin
  return query
  select
    d.id as dish_id,
    d.name as dish_name,
    v.id as venue_id,
    v.name as venue_name,
    v.address_city as venue_city,
    d.current_price,
    d.currency,
    d.is_available
  from public.dishes d
  inner join public.venues v on d.venue_id = v.id
  where d.dish_type_id = p_dish_type_id
    and (p_city is null or v.address_city ilike p_city)
    and d.is_available = true
  order by d.current_price asc nulls last
  limit p_limit;
end;
$$ language plpgsql stable;

-- Add comment for the function
comment on function public.find_dishes_by_type is 'Find all instances of a dish type across venues, optionally filtered by city';

-- Example usage:
-- SELECT * FROM find_dishes_by_type(
--   (SELECT id FROM dish_types WHERE name = 'Gumbo'),
--   'New Orleans'
-- );
