# Draft consolidated schema

A clean, from-scratch rebuild of the Forked database, consolidating the 26
migrations in `supabase/migrations/` into their final state **and fixing the
discrepancies found during the production-readiness cross-check** (repo files
vs. the live `Forked` project `bqxhinoabxmpsvzntrlq`).

These are **drafts for review**, not applied migrations. Apply order (or just
run `./apply-local.sh`, which resets the local stack's `public` schema and
applies everything below in order):

1. `draft_01_extensions_and_tables.sql` — extensions, enums, tables, indexes
2. `draft_02_rls_and_indexes.sql` — `is_admin()`, RLS enable, all policies
3. `draft_03_functions_and_rpcs.sql` — every callable RPC
4. `draft_seed.sql` — app_constants, national dish types, New Orleans city, badges
5. `draft_04_triggers_storage_cron.sql` — trigger functions, triggers, storage, cron
6. `draft_05_city_unlock_and_thresholds.sql` — US-wide pivot: configurable
   leaderboard thresholds (`app_constants`), nightly one-way
   `evaluate_city_unlocks()` cron (02:30 UTC), `match_location` distance,
   `get_flagship_board()`, removal of the dead Gemini-enrichment SQL
7. `draft_06_discover_per_dish_limit.sql` — discover RPCs gain
   `p_per_dish_limit`/`p_limit` (egress fix; signature change)

## Validated

Applied cleanly (0 errors) in order against Postgres 16 + PostGIS in a throwaway
container, with the Supabase-managed schemas (`auth`, `storage`, `cron`, `net`)
shimmed. Result: 28 tables, 66 policies, 43 functions. Every fix below was
asserted against the running schema (`pg_policies`, `pg_proc`, `has_function_privilege`).

## Security / correctness fixes vs. the live database

| # | Fix | Was in prod |
|---|-----|-------------|
| 1 | **`content_reports` review fields + admin RLS shipped** (`reviewed_by`, `reviewed_at`, `resolution_action`, `admin_notes`; "Admins can read all reports" / "Admins can update reports") | Two migrations (`20260405000000/1`) existed as files but were **never applied** — the admin moderation dashboard read columns and relied on policies the live DB lacked, so it returned zero reports to admins |
| 2 | **`restaurants` UPDATE/INSERT are admin-only** (`is_admin()`) | `USING(true) WITH CHECK(true)` — any authenticated user could flip `is_verified`/`is_closed` or rewrite name/address |
| 3 | **`cities` "Admins can manage cities" now has `USING (is_admin())`** | `FOR ALL` with `USING = NULL` (→ TRUE) — any authenticated user could **DELETE any city** |
| 4 | **`restaurant_dishes` writes are admin-only** | INSERT `WITH CHECK(true)`; rows are only ever written by the `auto_populate_restaurant_dish` trigger, so no client grant is needed |
| 5 | **`close_restaurant()` enforces `is_admin()`** | `SECURITY DEFINER`, no guard — any authenticated user could close any restaurant via `rpc()` |
| 6 | **`get_admin_daily_stats` / `get_admin_city_breakdown` / `get_admin_dish_type_breakdown` enforce `is_admin()`** (rewritten SQL→plpgsql) | `SECURITY DEFINER`, no guard — any authenticated user could read admin analytics via `rpc()` |
| 7 | **Internal-only functions `REVOKE EXECUTE ... FROM PUBLIC`** (score/stat helpers, `evaluate_badges`, `take_leaderboard_snapshot`, all trigger fns) | Executable by `anon`/`authenticated`. Note the revoke is **FROM PUBLIC** — a role-scoped revoke leaves the inherited default grant in place |
| 8 | **`search_path` pinned** on 9 functions that shipped without it | advisor `function_search_path_mutable` |
| 9 | **`pg_trgm` created in `extensions`, not `public`** | advisor `extension_in_public` |

## Intentionally preserved

- **PostgREST embed FK names** — `comparisons_user_profile_fkey`,
  `content_reports_reporter_id_fkey`, `content_reports_reported_rating_id_fkey`,
  `personal_ratings_user_id_fkey`. The apps embed on these names; do not rename.
- **Account-deletion tombstone design** — `profiles.id` has no FK to
  `auth.users`; user-owned tables reference `profiles` (not `auth.users`) so
  anonymized rows survive account deletion (`20260318000000`).
- **`user_waitlist` open INSERT** for `anon` — public waitlist signup, by design.
- ~~City-enrichment trigger left uninstalled~~ **Resolved by removal** (US-wide
  pivot): the `enrich-city-dish-types` edge function, its client invocation,
  and the related SQL (`check_city_is_new`, `trigger_enrich_city_dish_types`)
  are deleted. Dish types are seeded (`draft_seed.sql`) and admin-curated;
  cities activate via the nightly `evaluate_city_unlocks()` job in draft_05.
  **At prod promotion time:** run `supabase functions delete
  enrich-city-dish-types` on the live project.

## Deferred (not changed here)

- **Public storage buckets allow listing** (advisor `public_bucket_allows_listing`,
  5 buckets). Object access is by public URL, so removing the broad SELECT
  policies is safe only after confirming no client lists bucket contents. Left
  as-is with a note in draft 4.

## Not included (still sourced elsewhere)

- Seed data: `badge_definitions` seeds and city/dish seed data live in their
  original migrations / `supabase/seeds/`. These drafts are schema + RLS + RPC
  only. Add a seed step before a fresh bootstrap.
