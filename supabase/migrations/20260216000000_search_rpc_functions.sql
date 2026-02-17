-- Cross-search RPC functions using pg_trgm (already enabled)
-- 1. Search restaurants by name with fuzzy matching
create or replace function search_restaurants(search_term text) returns setof restaurants language sql stable as $$
select *
from restaurants
where similarity(name, search_term) > 0.15
    or similarity(replace(name, ' ', ''), search_term) > 0.15
    or name ilike '%' || search_term || '%'
order by greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) desc
limit 20;
$$;
-- 2. Search dish types by name/aliases with fuzzy matching
create or replace function search_dish_types(search_term text) returns setof dish_types language sql stable as $$
select *
from dish_types
where is_active = true
    and (
        similarity(name, search_term) > 0.15
        or similarity(replace(name, ' ', ''), search_term) > 0.15
        or name ilike '%' || search_term || '%'
        or exists (
            select 1
            from unnest(aliases) alias
            where alias ilike '%' || search_term || '%'
                or similarity(alias, search_term) > 0.15
        )
    )
order by greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) desc
limit 20;
$$;
-- 3. Search restaurant dishes (food items) by dish type name, returning joined data
create or replace function search_restaurant_dishes(search_term text) returns table (
        restaurant_dish_id uuid,
        dish_type_id uuid,
        dish_type_name text,
        dish_type_emoji text,
        restaurant_id uuid,
        restaurant_name text,
        photos text [],
        total_ratings integer
    ) language sql stable as $$
select rd.id as restaurant_dish_id,
    dt.id as dish_type_id,
    dt.name as dish_type_name,
    dt.emoji as dish_type_emoji,
    r.id as restaurant_id,
    r.name as restaurant_name,
    rd.photos,
    rd.total_ratings
from restaurant_dishes rd
    join dish_types dt on dt.id = rd.dish_type_id
    join restaurants r on r.id = rd.restaurant_id
where similarity(dt.name, search_term) > 0.15
    or similarity(replace(dt.name, ' ', ''), search_term) > 0.15
    or dt.name ilike '%' || search_term || '%'
order by greatest(
        similarity(dt.name, search_term),
        similarity(replace(dt.name, ' ', ''), search_term)
    ) desc
limit 20;
$$;