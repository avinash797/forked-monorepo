-- Create helpful_votes table to track review helpfulness
-- Prevents duplicate votes and enables "who found this helpful" queries

create table public.helpful_votes (
  -- Composite primary key (user + review)
  user_id uuid references auth.users(id) on delete cascade not null,
  review_id uuid references public.reviews(id) on delete cascade not null,

  -- Vote value (1 for helpful, -1 for not helpful - future feature)
  vote_value integer default 1 not null check (vote_value in (-1, 1)),

  -- When the vote was cast
  voted_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Primary key constraint
  primary key (user_id, review_id)
);

-- Enable Row Level Security
alter table public.helpful_votes enable row level security;

-- Policy: Users can view all helpful votes (for transparency)
create policy "Helpful votes are viewable by everyone"
  on public.helpful_votes for select
  using (true);

-- Policy: Authenticated users can vote
create policy "Authenticated users can vote on reviews"
  on public.helpful_votes for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can change their own votes
create policy "Users can update their own votes"
  on public.helpful_votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can remove their own votes
create policy "Users can delete their own votes"
  on public.helpful_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- Function to update helpful_votes_count on reviews table
create or replace function public.sync_review_helpful_count()
returns trigger as $$
begin
  -- Recalculate helpful votes count for the affected review
  update public.reviews
  set helpful_votes_count = (
    select count(*)
    from public.helpful_votes
    where review_id = coalesce(new.review_id, old.review_id)
    and vote_value = 1
  )
  where id = coalesce(new.review_id, old.review_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Triggers to keep review.helpful_votes_count in sync
create trigger on_helpful_vote_insert
  after insert on public.helpful_votes
  for each row execute procedure public.sync_review_helpful_count();

create trigger on_helpful_vote_update
  after update on public.helpful_votes
  for each row execute procedure public.sync_review_helpful_count();

create trigger on_helpful_vote_delete
  after delete on public.helpful_votes
  for each row execute procedure public.sync_review_helpful_count();

-- Indexes for performance
create index helpful_votes_review_id_idx on public.helpful_votes(review_id);
create index helpful_votes_voted_at_idx on public.helpful_votes(voted_at desc);

-- Function to check if user voted on a review
create or replace function public.user_voted_helpful(
  p_user_id uuid,
  p_review_id uuid
)
returns boolean as $$
begin
  return exists (
    select 1
    from public.helpful_votes
    where user_id = p_user_id
    and review_id = p_review_id
  );
end;
$$ language plpgsql stable;

-- Function to get top helpful reviews for a dish
create or replace function public.get_top_helpful_reviews(
  p_dish_id uuid,
  p_limit integer default 10
)
returns table (
  review_id uuid,
  user_id uuid,
  star_rating integer,
  review_text text,
  helpful_votes_count integer,
  created_at timestamp with time zone
) as $$
begin
  return query
  select
    r.id as review_id,
    r.user_id,
    r.star_rating,
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

-- Add comments for documentation
comment on table public.helpful_votes is 'Tracks which users found reviews helpful (prevents duplicate votes)';
comment on column public.helpful_votes.vote_value is 'Vote value: 1 for helpful, -1 for not helpful (future feature)';

-- Function to prevent users from voting on their own reviews
create or replace function public.prevent_self_voting()
returns trigger as $$
declare
  v_review_author_id uuid;
begin
  -- Get the user_id of the review author
  select user_id into v_review_author_id
  from public.reviews
  where id = new.review_id;

  -- Check if voter is the review author
  if new.user_id = v_review_author_id then
    raise exception 'Users cannot vote on their own reviews';
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to prevent self-voting
create trigger prevent_self_voting_trigger
  before insert or update on public.helpful_votes
  for each row execute procedure public.prevent_self_voting();
