-- Add admin RLS policies to content_reports.
-- The table was created with only user-facing INSERT/SELECT policies.
-- Admins need SELECT (to see all reports) and UPDATE (to resolve them).

create policy "Admins can read all reports"
  on public.content_reports
  for select
  using (is_admin());

create policy "Admins can update reports"
  on public.content_reports
  for update
  using (is_admin())
  with check (is_admin());
