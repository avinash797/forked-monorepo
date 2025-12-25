# Database Migrations

This folder contains SQL migration files for the Supabase database schema.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project: https://bqxhinoabxmpsvzntrlq.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of a migration file and paste it
5. Click **Run** or press `Ctrl+Enter`

### Option 2: Using Supabase CLI (Recommended for Production)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref bqxhinoabxmpsvzntrlq
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

### Option 3: Manual Migration via API

You can also run migrations programmatically using the Supabase client, but this is not recommended for schema changes.

## Migration Files

Migrations are named with the format: `YYYYMMDDHHMMSS_description.sql`

### Current Migrations

- **20250101000000_create_profiles_table.sql**
  - Creates the `profiles` table
  - Sets up Row Level Security policies
  - Creates triggers for automatic profile creation on signup
  - Creates triggers for auto-updating timestamps
  - Adds indexes for performance

## Schema Overview

### `public.profiles`

User profile information that extends `auth.users`.

**Key Features:**
- Automatically created when user signs up (via trigger)
- RLS enabled for data protection
- Public read access, users can only edit their own profile
- Includes username, location, bio, verification status, charms, and reputation

**Columns:**
- `id` (uuid, PK) - References auth.users.id
- `username` (text, unique) - Optional unique username
- `display_name` (text) - Display name
- `email` (text, unique, required) - User's email
- `location` (text) - Home city/region
- `created_at` (timestamp) - Account creation date
- `phone_verified` (boolean) - Phone verification status
- `email_verified` (boolean) - Email verification status
- `charms` (jsonb) - Array of earned charms
- `reputation_score` (integer) - User reputation
- `profile_photo_url` (text) - Profile photo URL
- `bio` (text) - User bio
- `updated_at` (timestamp) - Last update timestamp

## Best Practices

1. **Never delete migrations** - Always create new migrations to modify schema
2. **Test locally first** - If using Supabase CLI, test with `supabase db reset` locally
3. **Backup before running** - Always backup your database before running migrations in production
4. **Version control** - Keep migrations in git for team collaboration

## Rollback

To rollback a migration, create a new migration that reverses the changes. For example:

```sql
-- Rollback: Drop profiles table
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_updated on public.profiles;
drop function if exists public.handle_new_user();
drop function if exists public.handle_updated_at();
drop table if exists public.profiles;
```

## Future Migrations

Add new migration files for:
- Additional tables (charms, reviews, etc.)
- Schema modifications
- New indexes
- Policy updates
