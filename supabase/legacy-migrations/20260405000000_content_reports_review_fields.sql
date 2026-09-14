-- Add admin resolution tracking fields to content_reports
-- Mirrors the reviewer-tracking pattern already used on content_flags so that
-- who/when/what resolution happened is queryable directly on the report row.

alter table public.content_reports
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz,
  add column resolution_action text,
  add column admin_notes text;

create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);

create index if not exists content_reports_reported_rating_idx
  on public.content_reports (reported_rating_id);
