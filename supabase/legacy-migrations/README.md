# Legacy migrations (not applied, kept for history)

These 26 files were the migration history up to 2026-04-26. On 2026-09-13 the schema was
rebuilt from `supabase/draft/` — the consolidated, security-audited schema — which dropped and
recreated `public` and reset the migration history. The files in `supabase/migrations/` are the
new baseline and are the exact SQL recorded in the dev project's `supabase_migrations` table.

Nothing here is applied or replayed. They are kept only to trace why a table or policy looks the
way it does. Do not move a file back into `migrations/`.

`_bootstrap_20260913225212_reset_public_schema_for_draft_rebuild.sql.txt` is the one-off
statement that performed the rebuild on the dev project. It is stored with a `.txt` extension,
outside `migrations/`, on purpose: it contains `DROP SCHEMA public CASCADE` and
`DELETE FROM supabase_migrations.schema_migrations`, so it must never be picked up by
`supabase db push`.
