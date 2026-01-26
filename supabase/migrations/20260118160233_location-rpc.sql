-- Function to match a user's location (lat/long) to a City and Neighborhood
-- Returns a JSON object with 'city' and 'neighborhood' fields
create or replace function match_location(lat double precision, long double precision) returns json language plpgsql security definer as $$
declare _city_record record;
_neighborhood_record record;
_point extensions.geometry;
begin -- Create a point extensions.geometry from the input coordinates
-- Note: PostGIS uses (long, lat) order
_point := st_setsrid(st_point(long, lat), 4326);
-- 1. Find the active city strictly containing the point
select * into _city_record
from cities
where is_active = true -- Cast geography to extensions.geometry for ST_Contains if needed, or use ST_Covers for geography
    -- Assuming columns are geography, we cast to extensions.geometry for precise point-in-polygon
    and st_contains(coordinates::extensions.geometry, _point)
limit 1;
-- 2. If no city found strictly, find the closest active city within 50km
if _city_record is null then
select * into _city_record
from cities
where is_active = true
order by coordinates::extensions.geometry <->_point
limit 1;
-- If closest city is too far (> 50km = 50000m), ignore it
-- ST_Distance with geography returns meters
if _city_record is not null
and st_distance(_city_record.coordinates, _point::geography) > 50000 then _city_record := null;
end if;
end if;
-- 3. If city found, look for neighborhood
if _city_record is not null then
select * into _neighborhood_record
from neighborhoods
where city_id = _city_record.id
    and st_contains(boundary::extensions.geometry, _point)
limit 1;
end if;
return json_build_object(
    'city',
    case
        when _city_record is null then null
        else json_build_object(
            'id',
            _city_record.id,
            'name',
            _city_record.name,
            'state',
            _city_record.state,
            'slug',
            _city_record.slug
        )
    end,
    'neighborhood',
    case
        when _neighborhood_record is null then null
        else json_build_object(
            'id',
            _neighborhood_record.id,
            'name',
            _neighborhood_record.name,
            'slug',
            _neighborhood_record.slug
        )
    end
);
end;
$$;