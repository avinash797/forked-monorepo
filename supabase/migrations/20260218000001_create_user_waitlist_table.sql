-- Create user_waitlist table for collecting emails during waitlist mode
create table if not exists public.user_waitlist (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    source text,
    -- e.g. 'hero', 'cta', 'footer'
    created_at timestamptz not null default now()
);
-- Enable Row Level Security
alter table public.user_waitlist enable row level security;
-- Allow public inserts: both anonymous visitors and logged-in users can join the waitlist
create policy "Allow anonymous inserts" on public.user_waitlist for
insert to anon with check (true);
create policy "Allow authenticated inserts" on public.user_waitlist for
insert to authenticated with check (true);
-- Add an index on email for fast duplicate checks
create index idx_user_waitlist_email on public.user_waitlist (email);
