-- Create user_charms junction table
-- Tracks which charms/badges each user has earned

create table public.user_charms (
  -- Composite primary key (user + charm)
  user_id uuid references auth.users(id) on delete cascade not null,
  charm_id uuid references public.charms(id) on delete cascade not null,

  -- When the charm was unlocked
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Progress toward unlocking (for charms with incremental criteria)
  -- Example: {"current_count": 50, "required_count": 100}
  progress jsonb default '{}'::jsonb not null,

  -- Whether the charm is featured on user's profile
  is_featured boolean default false not null,

  -- Primary key constraint
  primary key (user_id, charm_id)
);

-- Enable Row Level Security
alter table public.user_charms enable row level security;

-- Policy: Users can view their own charms
create policy "Users can view their own charms"
  on public.user_charms for select
  using (user_id = auth.uid() or true); -- Allow public viewing for profile pages

-- Policy: System can grant charms (no direct user insertion)
-- Users shouldn't manually insert - charms are awarded via functions
create policy "System can grant charms"
  on public.user_charms for insert
  to authenticated
  with check (false); -- Prevent direct insertion, use grant_charm() function

-- Policy: Users can update featured status on their own charms
create policy "Users can feature their own charms"
  on public.user_charms for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: No deletion (charms are permanent once earned)
create policy "Charms cannot be deleted"
  on public.user_charms for delete
  using (false);

-- Indexes for performance
create index user_charms_user_id_idx on public.user_charms(user_id);
create index user_charms_charm_id_idx on public.user_charms(charm_id);
create index user_charms_unlocked_at_idx on public.user_charms(unlocked_at desc);
create index user_charms_featured_idx on public.user_charms(is_featured) where is_featured = true;

-- Function to grant a charm to a user
create or replace function public.grant_charm(
  p_user_id uuid,
  p_charm_id uuid
)
returns boolean as $$
declare
  v_already_has_charm boolean;
begin
  -- Check if user already has this charm
  select exists (
    select 1 from public.user_charms
    where user_id = p_user_id and charm_id = p_charm_id
  ) into v_already_has_charm;

  -- If already has charm, return false
  if v_already_has_charm then
    return false;
  end if;

  -- Grant the charm
  insert into public.user_charms (user_id, charm_id)
  values (p_user_id, p_charm_id);

  return true;
end;
$$ language plpgsql security definer;

-- Function to check if user has earned a charm based on criteria
create or replace function public.check_and_grant_charms(p_user_id uuid)
returns integer as $$
declare
  v_charm record;
  v_criteria jsonb;
  v_granted_count integer := 0;
  v_count integer;
begin
  -- Loop through all active charms
  for v_charm in
    select id, unlock_criteria
    from public.charms
    where is_active = true
  loop
    v_criteria := v_charm.unlock_criteria;

    -- Skip if user already has this charm
    if exists (
      select 1 from public.user_charms
      where user_id = p_user_id and charm_id = v_charm.id
    ) then
      continue;
    end if;

    -- Check different criteria types
    case v_criteria->>'type'

      -- Review count
      when 'review_count' then
        select count(*) into v_count
        from public.reviews
        where user_id = p_user_id and moderation_status = 'approved';

        if v_count >= (v_criteria->>'min_count')::integer then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      -- Early adopter
      when 'early_adopter' then
        if (
          select created_at
          from public.profiles
          where id = p_user_id
        ) < (v_criteria->>'join_before')::timestamp with time zone then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      -- Helpful votes received
      when 'helpful_votes_received' then
        select sum(helpful_votes_count) into v_count
        from public.reviews
        where user_id = p_user_id and moderation_status = 'approved';

        if v_count >= (v_criteria->>'min_count')::integer then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      -- Photos uploaded
      when 'photos_uploaded' then
        select count(*) into v_count
        from public.photos
        where uploaded_by_user_id = p_user_id and moderation_status = 'approved';

        if v_count >= (v_criteria->>'min_count')::integer then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      -- 5-star reviews
      when 'five_star_reviews' then
        select count(*) into v_count
        from public.reviews
        where user_id = p_user_id
          and star_rating = 5
          and moderation_status = 'approved';

        if v_count >= (v_criteria->>'min_count')::integer then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      -- Location explorer (cities)
      when 'location_explorer' then
        select count(distinct v.address_city) into v_count
        from public.reviews r
        join public.venues v on r.venue_id = v.id
        where r.user_id = p_user_id and r.moderation_status = 'approved';

        if v_count >= (v_criteria->>'min_cities')::integer then
          perform public.grant_charm(p_user_id, v_charm.id);
          v_granted_count := v_granted_count + 1;
        end if;

      else
        -- Unknown criteria type, skip
        continue;
    end case;
  end loop;

  return v_granted_count;
end;
$$ language plpgsql security definer;

-- Function to get user's charms
create or replace function public.get_user_charms(p_user_id uuid)
returns table (
  charm_id uuid,
  charm_name text,
  charm_description text,
  charm_icon_url text,
  rarity_tier text,
  unlocked_at timestamp with time zone,
  is_featured boolean
) as $$
begin
  return query
  select
    c.id as charm_id,
    c.name as charm_name,
    c.description as charm_description,
    c.icon_url as charm_icon_url,
    c.rarity_tier,
    uc.unlocked_at,
    uc.is_featured
  from public.user_charms uc
  join public.charms c on uc.charm_id = c.id
  where uc.user_id = p_user_id
  order by c.rarity_tier desc, uc.unlocked_at desc;
end;
$$ language plpgsql stable;

-- Add comments for documentation
comment on table public.user_charms is 'Junction table tracking which charms each user has earned';
comment on column public.user_charms.progress is 'JSONB tracking progress toward unlocking (for incremental charms)';
comment on column public.user_charms.is_featured is 'Whether this charm is featured on user profile';

-- Trigger to check for new charms when user creates a review
create or replace function public.check_charms_on_review()
returns trigger as $$
begin
  -- Check and grant charms for this user
  perform public.check_and_grant_charms(new.user_id);
  return new;
end;
$$ language plpgsql;

create trigger check_charms_after_review_insert
  after insert on public.reviews
  for each row execute procedure public.check_charms_on_review();
