-- Create photos table with polymorphic associations
-- Photos can be associated with reviews, dishes, or venues

create table public.photos (
  -- Photo ID (primary key)
  id uuid default gen_random_uuid() primary key,

  -- Uploaded by (required)
  uploaded_by_user_id uuid references auth.users(id) on delete cascade not null,

  -- Polymorphic association (entity can be review, dish, or venue)
  entity_type text not null check (entity_type in ('review', 'dish', 'venue')),
  entity_id uuid not null,

  -- Upload timestamp
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- URL/storage path
  storage_path text not null,
  url text not null,

  -- File metadata
  file_size_bytes integer,
  mime_type text,
  width integer,
  height integer,

  -- Moderation status
  moderation_status text default 'pending' not null check (
    moderation_status in ('pending', 'approved', 'flagged', 'rejected')
  ),
  flagged_reason text,

  -- AI verification for dish photos
  ai_detected_dish_type text,
  ai_confidence_score decimal(3, 2), -- 0.00 to 1.00

  -- EXIF data (optional metadata from camera)
  exif_data jsonb default '{}'::jsonb not null,
  -- Example: {"camera": "iPhone 14 Pro", "location": {"lat": 29.95, "lon": -90.07}, "timestamp": "..."}

  -- Display order (for ordering multiple photos)
  display_order integer default 0 not null
);

-- Enable Row Level Security
alter table public.photos enable row level security;

-- Policy: Approved photos are viewable by everyone
create policy "Approved photos are viewable by everyone"
  on public.photos for select
  using (moderation_status = 'approved' or uploaded_by_user_id = auth.uid());

-- Policy: Authenticated users can upload photos
create policy "Authenticated users can upload photos"
  on public.photos for insert
  to authenticated
  with check (uploaded_by_user_id = auth.uid());

-- Policy: Users can update their own pending photos
create policy "Users can update their own pending photos"
  on public.photos for update
  to authenticated
  using (uploaded_by_user_id = auth.uid() and moderation_status = 'pending')
  with check (uploaded_by_user_id = auth.uid());

-- Policy: Users can delete their own photos
create policy "Users can delete their own photos"
  on public.photos for delete
  to authenticated
  using (uploaded_by_user_id = auth.uid());

-- Indexes for performance
create index photos_uploaded_by_idx on public.photos(uploaded_by_user_id);
create index photos_entity_idx on public.photos(entity_type, entity_id);
create index photos_uploaded_at_idx on public.photos(uploaded_at desc);
create index photos_moderation_status_idx on public.photos(moderation_status);

-- Composite index for common query (entity + approved photos)
create index photos_entity_approved_idx on public.photos(entity_type, entity_id, display_order)
  where moderation_status = 'approved';

-- Foreign key constraints using triggers (for polymorphic relationships)
-- This ensures entity_id references a valid review, dish, or venue

create or replace function public.validate_photo_entity()
returns trigger as $$
begin
  if new.entity_type = 'review' then
    if not exists (select 1 from public.reviews where id = new.entity_id) then
      raise exception 'Review with id % does not exist', new.entity_id;
    end if;
  elsif new.entity_type = 'dish' then
    if not exists (select 1 from public.dishes where id = new.entity_id) then
      raise exception 'Dish with id % does not exist', new.entity_id;
    end if;
  elsif new.entity_type = 'venue' then
    if not exists (select 1 from public.venues where id = new.entity_id) then
      raise exception 'Venue with id % does not exist', new.entity_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to validate polymorphic relationship
create trigger validate_photo_entity_trigger
  before insert or update on public.photos
  for each row execute procedure public.validate_photo_entity();

-- Helper function to get photos for an entity
create or replace function public.get_entity_photos(
  p_entity_type text,
  p_entity_id uuid,
  p_limit integer default 20
)
returns table (
  photo_id uuid,
  url text,
  uploaded_by_user_id uuid,
  uploaded_at timestamp with time zone,
  width integer,
  height integer,
  display_order integer
) as $$
begin
  return query
  select
    p.id as photo_id,
    p.url,
    p.uploaded_by_user_id,
    p.uploaded_at,
    p.width,
    p.height,
    p.display_order
  from public.photos p
  where p.entity_type = p_entity_type
    and p.entity_id = p_entity_id
    and p.moderation_status = 'approved'
  order by p.display_order asc, p.uploaded_at asc
  limit p_limit;
end;
$$ language plpgsql stable;

-- Add comments for documentation
comment on table public.photos is 'Photos with polymorphic associations to reviews, dishes, or venues';
comment on column public.photos.entity_type is 'Type of entity this photo belongs to (review, dish, venue)';
comment on column public.photos.entity_id is 'ID of the review, dish, or venue';
comment on column public.photos.exif_data is 'JSONB containing EXIF metadata from camera (location, camera model, etc.)';
comment on column public.photos.ai_detected_dish_type is 'AI-detected dish type for verification';
comment on column public.photos.ai_confidence_score is 'AI confidence score (0.00 to 1.00)';
