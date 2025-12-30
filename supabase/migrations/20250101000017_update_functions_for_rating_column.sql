-- Update all remaining functions that reference old 'star_rating' column name
-- These functions were created before the column rename and need to be updated

-- ============================================================================
-- Fix 1: Update get_helpful_reviews() function
-- ============================================================================

create or replace function public.get_helpful_reviews(
  p_dish_id uuid,
  p_limit integer default 10
)
returns table (
  review_id uuid,
  user_id uuid,
  rating integer,  -- Updated from star_rating to rating
  review_text text,
  helpful_votes_count integer,
  created_at timestamp with time zone
) as $$
begin
  return query
  select
    r.id as review_id,
    r.user_id,
    r.rating,  -- Updated from star_rating to rating
    r.review_text,
    r.helpful_votes_count,
    r.created_at
  from public.reviews r
  where r.dish_id = p_dish_id
    and r.moderation_status = 'approved'
  order by r.helpful_votes_count desc, r.created_at desc
  limit p_limit;
end;
$$ language plpgsql stable;

-- ============================================================================
-- Fix 2: Update check_and_grant_charms() function (THIS IS THE ONE BEING TRIGGERED!)
-- ============================================================================

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

      -- 5-star reviews (Updated to use 'rating' column with value 10 on 0-10 scale)
      when 'five_star_reviews' then
        select count(*) into v_count
        from public.reviews
        where user_id = p_user_id
          and rating = 10  -- Updated from star_rating = 5 to rating = 10
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

-- Add comments for documentation
comment on function public.get_helpful_reviews(uuid, integer) is 'Returns most helpful reviews for a dish (updated for rating column)';
comment on function public.check_and_grant_charms(uuid) is 'Checks and grants charms to user based on achievements (updated for rating column and 0-10 scale)';
