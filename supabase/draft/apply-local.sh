#!/usr/bin/env bash
# Apply the draft schema (+ seeds + feature drafts) to the LOCAL Supabase stack.
# Destructive to local data: drops and recreates the public schema.
# Usage: ./supabase/draft/apply-local.sh   (from anywhere; resolves its own paths)
set -euo pipefail

DRAFT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Local stack DB URL (supabase CLI default port). Override with DB_URL env var.
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
DB_CONTAINER="${DB_CONTAINER:-supabase_db_forked}"

# Host psql if available, otherwise docker exec into the local db container.
if command -v psql >/dev/null 2>&1; then
    run_sql() { psql "$DB_URL" -v ON_ERROR_STOP=1 -q "$@"; }
    run_sql_file() { psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"; }
else
    run_sql() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }
    run_sql_file() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$1"; }
fi

if ! run_sql -Atc "SELECT 1" >/dev/null 2>&1; then
    echo "error: cannot reach local Supabase Postgres — run 'supabase start' first" >&2
    exit 1
fi

echo "==> Resetting public schema (local only)"
run_sql <<'SQL'
-- Unschedule all cron jobs (they reference functions about to be dropped)
DO $$
DECLARE j RECORD;
BEGIN
    FOR j IN SELECT jobname FROM cron.job LOOP
        PERFORM cron.unschedule(j.jobname);
    END LOOP;
END $$;

-- Drop draft-managed storage policies (CREATE POLICY in draft_04 is not idempotent)
DO $$
DECLARE p RECORD;
BEGIN
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
    END LOOP;
END $$;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore Supabase-standard grants and default privileges on public
GRANT USAGE, CREATE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
SQL

apply() {
    echo "==> Applying $(basename "$1")"
    run_sql_file "$1"
}

apply "$DRAFT_DIR/draft_01_extensions_and_tables.sql"
apply "$DRAFT_DIR/draft_02_rls_and_indexes.sql"
apply "$DRAFT_DIR/draft_03_functions_and_rpcs.sql"
apply "$DRAFT_DIR/draft_seed.sql"          # before draft_04: its snapshot backfill reads seeded state
apply "$DRAFT_DIR/draft_04_triggers_storage_cron.sql"

# Feature drafts (added as the US-wide pivot lands)
for f in "$DRAFT_DIR"/draft_0[5-9]_*.sql; do
    [ -e "$f" ] && apply "$f"
done

echo "==> Verification"
run_sql <<'SQL'
SELECT
    (SELECT count(*) FROM pg_tables  WHERE schemaname = 'public')                    AS tables,
    (SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','storage'))      AS policies,
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public')                                                    AS functions,
    (SELECT count(*) FROM public.dish_types)                                         AS dish_types,
    (SELECT count(*) FROM public.cities WHERE is_active)                             AS active_cities;
SELECT jobname, schedule FROM cron.job ORDER BY jobname;
SQL

echo "==> Done. Next: npm run gen:types && npm run typecheck"
