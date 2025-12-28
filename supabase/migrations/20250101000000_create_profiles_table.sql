-- Create profiles table that extends auth.users
create table public.profiles (
  -- User ID (primary key)
  id uuid references auth.users on delete cascade primary key,

  -- Username/Display name
  username text unique,
  display_name text,

  -- Email (authentication) - synced from auth.users
  email text unique not null,

  -- Location (home city/region)
  location text,

  -- Account creation date
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Verification status
  phone_verified boolean default false not null,
  email_verified boolean default false not null,

  -- Charms earned (array of charm objects with IDs and timestamps)
  charms jsonb default '[]'::jsonb not null,

  -- Reputation score (calculated from review quality, consistency)
  reputation_score integer default 0 not null,

  -- Profile photo
  profile_photo_url text,

  -- Bio (optional)
  bio text,

  -- Last updated timestamp
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: Users can view any profile (public profiles)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Policy: Users can update their own profile only
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policy: Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, email_verified)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.email_confirmed_at is not null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create indexes for performance
create index profiles_username_idx on public.profiles(username);
create index profiles_email_idx on public.profiles(email);

-- Add comments for documentation
comment on table public.profiles is 'User profile information that extends auth.users';
comment on column public.profiles.id is 'References auth.users.id';
comment on column public.profiles.username is 'Unique username for the user';
comment on column public.profiles.display_name is 'Display name shown in the app';
comment on column public.profiles.charms is 'Array of charm objects: [{id: string, timestamp: string}]';
comment on column public.profiles.reputation_score is 'Calculated from review quality and consistency';
