-- Add average_rating and review_count to dishes table
-- Rename star_rating to rating in reviews table

-- Step 1: Add new columns to dishes table
alter table public.dishes
  add column average_rating decimal(4, 2) check (average_rating >= 0 and average_rating <= 10),
  add column review_count integer default 0 not null;

-- Add index for sorting by rating
create index dishes_average_rating_idx on public.dishes(average_rating desc nulls last);

-- Add comment for documentation
comment on column public.dishes.average_rating is 'Average rating from all approved reviews (0-10 scale, null if no reviews)';
comment on column public.dishes.review_count is 'Total count of approved reviews for this dish';

-- Step 2: Rename star_rating to rating in reviews table
alter table public.reviews
  rename column star_rating to rating;

-- Update rating column constraint to 0-10 scale
alter table public.reviews
  drop constraint if exists reviews_rating_check;

alter table public.reviews
  add constraint reviews_rating_check check (rating >= 0 and rating <= 10);

-- Recreate index with new column name
drop index if exists reviews_star_rating_idx;
create index reviews_rating_idx on public.reviews(rating);

-- Step 3: Update the handle_review_update() function to use new column name
create or replace function public.handle_review_update()
returns trigger as $$
declare
  changes jsonb;
begin
  -- Track what changed
  changes := jsonb_build_object(
    'rating', case when old.rating != new.rating then jsonb_build_object('old', old.rating, 'new', new.rating) else null end,
    'review_text', case when old.review_text != new.review_text then jsonb_build_object('old', old.review_text, 'new', new.review_text) else null end
  );

  -- Remove null values
  changes := (select jsonb_object_agg(key, value) from jsonb_each(changes) where value is not null);

  -- Only add to history if there are actual changes
  if changes is not null and changes != '{}'::jsonb then
    new.edit_history := old.edit_history || jsonb_build_array(
      jsonb_build_object(
        'timestamp', now(),
        'changes', changes
      )
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- Step 4: Create function to update dish ratings when reviews change
create or replace function public.update_dish_ratings()
returns trigger as $$
declare
  v_dish_id uuid;
  v_avg_rating decimal(3, 2);
  v_review_count integer;
begin
  -- Determine which dish to update
  if tg_op = 'DELETE' then
    v_dish_id := old.dish_id;
  else
    v_dish_id := new.dish_id;
  end if;

  -- Calculate new average rating and count from approved reviews only
  select
    round(avg(rating)::numeric, 2),
    count(*)::integer
  into v_avg_rating, v_review_count
  from public.reviews
  where dish_id = v_dish_id
    and moderation_status = 'approved';

  -- Update dishes table (set to null if no approved reviews)
  update public.dishes
  set
    average_rating = v_avg_rating,
    review_count = v_review_count
  where id = v_dish_id;

  -- Return appropriate record
  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql;

-- Step 5: Create triggers to auto-update dish ratings
create trigger on_review_inserted_update_dish_rating
  after insert on public.reviews
  for each row execute procedure public.update_dish_ratings();

create trigger on_review_updated_update_dish_rating
  after update on public.reviews
  for each row
  when (old.rating != new.rating or old.moderation_status != new.moderation_status)
  execute procedure public.update_dish_ratings();

create trigger on_review_deleted_update_dish_rating
  after delete on public.reviews
  for each row execute procedure public.update_dish_ratings();

-- Step 6: Populate existing data (calculate ratings for existing dishes)
update public.dishes d
set
  average_rating = subquery.avg_rating,
  review_count = subquery.review_count
from (
  select
    dish_id,
    round(avg(rating)::numeric, 2) as avg_rating,
    count(*)::integer as review_count
  from public.reviews
  where moderation_status = 'approved'
  group by dish_id
) as subquery
where d.id = subquery.dish_id;
