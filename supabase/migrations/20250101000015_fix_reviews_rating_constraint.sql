-- Fix: Drop the old star_rating check constraint that was missed during column rename
-- The original constraint was named 'reviews_star_rating_check' but the rename migration
-- tried to drop 'reviews_rating_check' instead, leaving the old constraint orphaned

-- Drop the old constraint that references the old column name
alter table public.reviews
  drop constraint if exists reviews_star_rating_check;

-- Ensure the new constraint exists with correct column name and scale
alter table public.reviews
  drop constraint if exists reviews_rating_check;

alter table public.reviews
  add constraint reviews_rating_check check (rating >= 0 and rating <= 10);

-- Add comment for documentation
comment on constraint reviews_rating_check on public.reviews is 'Rating must be between 0 and 10';
