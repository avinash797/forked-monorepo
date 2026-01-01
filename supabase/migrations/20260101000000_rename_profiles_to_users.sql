-- Enable pgvector extension for taste_profile vector column
CREATE EXTENSION IF NOT EXISTS vector;
-- Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
-- Drop triggers (we'll recreate them after renaming)
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Drop functions (we'll recreate with updated logic)
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Rename column: profile_photo_url -> avatar_url
ALTER TABLE public.profiles
  RENAME COLUMN profile_photo_url TO avatar_url;
-- Change reputation_score type from integer to DECIMAL(3,2)
ALTER TABLE public.profiles
ALTER COLUMN reputation_score TYPE DECIMAL(3, 2) USING reputation_score::DECIMAL(3, 2),
  ALTER COLUMN reputation_score
SET DEFAULT 0.50;
-- Add taste_profile column
ALTER TABLE public.profiles
ADD COLUMN taste_profile VECTOR(128);
-- Rename table: profiles -> users
ALTER TABLE public.profiles
  RENAME TO users;
-- Recreate RLS policies with new table name
CREATE POLICY "Users are viewable by everyone" ON public.users FOR
SELECT USING (true);
CREATE POLICY "Users can update own user" ON public.users FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own user" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Recreate function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN new.updated_at = now();
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- Recreate trigger to auto-update updated_at
CREATE TRIGGER on_user_updated BEFORE
UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
-- Recreate function to automatically create user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, display_name, email_verified)
VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.email_confirmed_at IS NOT NULL
  );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Recreate trigger to create user when auth user signs up
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Update indexes
DROP INDEX IF EXISTS public.profiles_username_idx;
DROP INDEX IF EXISTS public.profiles_email_idx;
CREATE INDEX users_username_idx ON public.users(username);
CREATE INDEX users_email_idx ON public.users(email);
-- Update table and column comments
COMMENT ON TABLE public.users IS 'User profile information that extends auth.users';
COMMENT ON COLUMN public.users.id IS 'References auth.users.id';
COMMENT ON COLUMN public.users.username IS 'Unique username for the user';
COMMENT ON COLUMN public.users.display_name IS 'Display name shown in the app';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile photo';
COMMENT ON COLUMN public.users.reputation_score IS 'User reputation score (0.00 to 9.99)';
COMMENT ON COLUMN public.users.taste_profile IS 'Vector embedding of user taste preferences (128 dimensions)';