-- Add foreign key from comparisons.user_id to profiles.id
-- This enables PostgREST to follow the relationship for joins
-- Both comparisons.user_id and profiles.id reference auth.users.id,
-- so the values are the same and this constraint will be satisfied.
ALTER TABLE public.comparisons
ADD CONSTRAINT comparisons_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- Add a comment explaining the dual FK relationship
COMMENT ON CONSTRAINT comparisons_user_profile_fkey ON public.comparisons IS 'Links to profiles for PostgREST joins. user_id also references auth.users via comparisons_user_id_fkey.';