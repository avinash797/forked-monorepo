-- Create reviews/ratings table
-- User reviews of dishes with verification and helpful votes

create table public.reviews (
  -- Rating ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- User who wrote the review (required)
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Dish being reviewed (required)
  dish_id uuid references public.dishes(id) on delete cascade not null,

  -- Venue (redundant for quick queries without join)
  venue_id uuid references public.venues(id) on delete cascade not null,

  -- Star rating (1-5, required)
  star_rating integer not null check (star_rating >= 1 and star_rating <= 5),

  -- Review text (optional)
  review_text text,

  -- Photos (array of photo URLs - will be migrated to photos table)
  -- Keeping this for backward compatibility, but photos table is preferred
  photo_urls text[] default '{}',

  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Location verification
  -- GPS coordinates where review was submitted
  location_latitude decimal(10, 8),
  location_longitude decimal(11, 8),

  -- Verification flags
  is_gps_verified boolean default false not null,
  is_photo_verified boolean default false not null,
  needs_human_review boolean default false not null,

  -- Helpful votes
  helpful_votes_count integer default 0 not null,

  -- Edit history (JSONB array of edit records)
  -- Format: [{ "timestamp": "...", "changes": { "field": "old -> new" } }]
  edit_history jsonb default '[]'::jsonb not null,

  -- Moderation status
  moderation_status text default 'approved' not null check (
    moderation_status in ('pending', 'approved', 'flagged', 'rejected')
  ),

  -- Flagged reason (if status is 'flagged' or 'rejected')
  flagged_reason text
);

-- Enable Row Level Security
alter table public.reviews enable row level security;

-- Policy: Everyone can view approved reviews
create policy "Approved reviews are viewable by everyone"
  on public.reviews for select
  using (moderation_status = 'approved' or user_id = auth.uid());

-- Policy: Authenticated users can create reviews
create policy "Authenticated users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update their own reviews (within limits)
create policy "Users can update their own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete their own reviews
create policy "Users can delete their own reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid());

-- Function to update updated_at timestamp and track edit history
create or replace function public.handle_review_update()
returns trigger as $$
declare
  changes jsonb;
begin
  -- Track what changed
  changes := jsonb_build_object(
    'star_rating', case when old.star_rating != new.star_rating then jsonb_build_object('old', old.star_rating, 'new', new.star_rating) else null end,
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

-- Trigger to track edits and update timestamp
create trigger on_review_updated
  before update on public.reviews
  for each row execute procedure public.handle_review_update();

-- Function to verify GPS location (checks if review location is near venue)
create or replace function public.verify_review_gps(
  p_review_id uuid,
  p_max_distance_meters integer default 500
)
returns boolean as $$
declare
  v_review_lat decimal;
  v_review_lon decimal;
  v_venue_lat decimal;
  v_venue_lon decimal;
  v_distance_meters integer;
begin
  -- Get review and venue coordinates
  select
    r.location_latitude,
    r.location_longitude,
    v.latitude,
    v.longitude
  into v_review_lat, v_review_lon, v_venue_lat, v_venue_lon
  from public.reviews r
  join public.venues v on r.venue_id = v.id
  where r.id = p_review_id;

  -- If any coordinates are missing, cannot verify
  if v_review_lat is null or v_review_lon is null or v_venue_lat is null or v_venue_lon is null then
    return false;
  end if;

  -- Calculate distance using Haversine formula (simplified)
  -- For more accurate results, use PostGIS extension
  v_distance_meters := (
    6371000 * acos(
      cos(radians(v_review_lat)) *
      cos(radians(v_venue_lat)) *
      cos(radians(v_venue_lon) - radians(v_review_lon)) +
      sin(radians(v_review_lat)) *
      sin(radians(v_venue_lat))
    )
  )::integer;

  -- Return true if within max distance
  return v_distance_meters <= p_max_distance_meters;
end;
$$ language plpgsql stable;

-- Indexes for performance
create index reviews_user_id_idx on public.reviews(user_id);
create index reviews_dish_id_idx on public.reviews(dish_id);
create index reviews_venue_id_idx on public.reviews(venue_id);
create index reviews_created_at_idx on public.reviews(created_at desc);
create index reviews_star_rating_idx on public.reviews(star_rating);
create index reviews_moderation_status_idx on public.reviews(moderation_status);
create index reviews_gps_verified_idx on public.reviews(is_gps_verified) where is_gps_verified = true;

-- Composite indexes for common queries
create index reviews_dish_approved_idx on public.reviews(dish_id, moderation_status, created_at desc)
  where moderation_status = 'approved';
create index reviews_venue_approved_idx on public.reviews(venue_id, moderation_status, created_at desc)
  where moderation_status = 'approved';

-- Prevent duplicate reviews (one review per user per dish)
create unique index reviews_user_dish_unique_idx on public.reviews(user_id, dish_id);

-- Add comments for documentation
comment on table public.reviews is 'User reviews and ratings for dishes';
comment on column public.reviews.venue_id is 'Redundant venue reference for quick queries without joins';
comment on column public.reviews.location_latitude is 'GPS latitude where review was submitted (for verification)';
comment on column public.reviews.is_gps_verified is 'Whether user was at venue location when reviewing';
comment on column public.reviews.is_photo_verified is 'Whether AI confirmed dish type from photos';
comment on column public.reviews.needs_human_review is 'Flagged for manual quality check';
comment on column public.reviews.edit_history is 'JSONB array tracking all edits to this review';
