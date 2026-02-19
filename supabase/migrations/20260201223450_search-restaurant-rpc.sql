create or replace function search_restaurants(search_term text) returns setof restaurants language sql as $$
select *
from restaurants
where -- 1. Standard Similarity (good for typos like "Dasi Vega")
    similarity(name, search_term) > 0.15 -- 2. "Squashed" Similarity (catches "desiv" -> "Desi Vega")
    OR similarity(replace(name, ' ', ''), search_term) > 0.15 -- 3. Standard ILIKE (catches exact substrings)
    OR name ilike '%' || search_term || '%' -- Order by whichever method gives the highest score
order by greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) desc
limit 20;
$$;