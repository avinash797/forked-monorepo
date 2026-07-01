# Monorepo Production-Readiness Audit — Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one severity-tagged findings report
(`docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md`)
covering shared packages, migrations/schema/security, both apps, and CI/CD —
per the design in
`docs/superpowers/specs/2026-07-01-monorepo-production-audit-design.md`.

**Architecture:** Hybrid execution on branch `audit/production-readiness`.
The main agent audits Area 1 (shared packages) and Area 2
(migrations/schema/security) directly, since judging duplication and drift
requires holding both apps in context at once. Three parallel subagents each
audit one self-contained area (web app, mobile app, CI/CD) and write their
raw findings to scratch files. The main agent then synthesizes all five
inputs into the one final report, deduping overlaps and ordering by
severity.

**Tech Stack:** N/A — this is an analysis/documentation task, not a code
change. No tests are written; "verification" for each task means the
finding is backed by an actual file/line reference the reader can check
themselves.

**Output convention:** every finding recorded in this plan's tasks uses:
`- [SEVERITY] <one-line summary> — \`path/to/file:line\`` followed by a
2-4 sentence explanation + recommendation, per the rubric in the design doc
(Critical / High / Medium / Low).

---

### Task 0: Create report skeleton

**Files:**
- Create: `docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md`

- [ ] **Step 1: Write the skeleton file**

```markdown
# Monorepo Production-Readiness Audit

_Audit of the forked-monorepo prior to production launch. See design doc:
[2026-07-01-monorepo-production-audit-design.md](./2026-07-01-monorepo-production-audit-design.md)._

## Summary

<!-- filled in last: counts by severity, top 3-5 blockers -->

## Area 1: Shared Packages

## Area 2: Migrations, Schema & Security

## Area 3a: Web App

## Area 3b: Mobile App

## Area 4: CI/CD & Build
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md
git commit -m "docs: scaffold production audit report"
```

---

### Task 1: Audit shared packages (main agent, direct)

**Files (read-only inspection, no modification):**
- `packages/supabase/src/{index,native,web,server,database.types,rpc.types,badge.types}.ts`, `packages/supabase/package.json`, `packages/supabase/tsconfig.json`
- `packages/types/src/{index,auth,dishes,restaurant,taste-tags}.ts`
- `packages/theme/src/{index,palettes,scales}.ts`, `packages/theme/theme.css`, `packages/theme/scripts/generate-css.ts`
- `packages/utils/src/{index,score,validators,us-states}.ts`
- `packages/typescript-config/{base,library,nextjs,react-native}.json`
- `apps/web/next.config.ts` (transpilePackages)
- `apps/mobile/package.json`, `apps/mobile/metro.config.js` (or equivalent)
- **Output:** append findings to Area 1 section of the report from Task 0.

- [ ] **Step 1: Check every shared package is actually consumed by both apps where expected**

```bash
for pkg in supabase types theme utils typescript-config; do
  echo "=== $pkg ==="; grep -rn "@forked/$pkg" apps/web/package.json apps/mobile/package.json
done
```
Expected: each package appears in both apps' `package.json` dependencies
unless there's a documented reason it's app-specific (e.g. `native.ts` is
mobile-only). Record any app missing a package it clearly needs (e.g. an app
importing `@forked/utils` at runtime without declaring the dependency).

- [ ] **Step 2: Search both apps for domain types that duplicate `@forked/types`**

```bash
grep -rn "interface Restaurant\|type Restaurant\b\|interface DishType\|interface TasteTag\|interface UserProfile" apps/web/src apps/mobile --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```
For every hit outside `packages/types/src`, check whether it's a genuine
duplicate (should be deleted and replaced with an import) or a legitimately
different local shape (e.g. a form-input subset). Record duplicates as
High severity (violates the CLAUDE.md rule "never duplicate a type or
constant across apps").

- [ ] **Step 3: Search for score/confidence/validator logic duplicated outside `@forked/utils`**

```bash
grep -rln "getScoreTier\|formatScore\|confidence" apps/web/src apps/mobile --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -rn "function getScoreTier\|function formatScore\|const getScoreTier\|const formatScore" apps/web/src apps/mobile --include="*.ts" --include="*.tsx"
```
Any app-local re-implementation of a function that already exists in
`packages/utils/src/score.ts` is a High-severity duplicate.

- [ ] **Step 4: Verify `transpilePackages` in `apps/web/next.config.ts` lists every shared package**

Read `apps/web/next.config.ts`. Compare the `transpilePackages` array against
the five `packages/*` directories. Any shared package imported by web but
missing from this array is High severity (will break the Next.js build once
that import path is exercised in a fresh build).

- [ ] **Step 5: Confirm the mobile/web palette divergence is intentional, not accidental drift**

Read `packages/theme/src/palettes.ts` in full. Confirm `mobilePalette` and
`webPalette` are clearly two distinct, deliberately-named exports (per
README: "they diverged pre-merge... converging them is a one-file design
decision"). Check both apps import the correct one for their platform:

```bash
grep -rn "mobilePalette\|webPalette" apps/web/src apps/mobile --include="*.ts" --include="*.tsx"
```
If either app imports the wrong palette, that's Critical (visibly wrong UI).
If the divergence looks accidental (e.g. one token name misspelled instead
of a deliberate value difference), record as Medium with a recommendation
to converge.

- [ ] **Step 6: Check for orphaned per-app type shims that the 2026-06-12 reorg should have deleted**

```bash
find apps/web/src apps/mobile -type d -iname "types" -not -path "*/node_modules/*"
find apps/web/src apps/mobile -type f -iname "*.types.ts" -not -path "*/node_modules/*"
```
Per the README, "deleted the per-app type shims... all imports now go
straight to the shared packages" — any survivors here are Medium-severity
leftover debt (or High if still actively imported instead of the shared
package).

- [ ] **Step 7: Confirm every package + app extends the correct `@forked/typescript-config` base**

```bash
for f in apps/web/tsconfig.json apps/mobile/tsconfig.json packages/*/tsconfig.json; do
  echo "=== $f ==="; grep -A1 '"extends"' "$f"
done
```
`apps/web` should extend `nextjs.json`, `apps/mobile` should extend
`react-native.json`, packages should extend `base.json` or `library.json`.
Any mismatch (e.g. web extending the react-native base) is High severity.

- [ ] **Step 8: Append all findings from Steps 1-7 to the report's Area 1 section, then commit**

```bash
git add docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md
git commit -m "docs: audit findings for shared packages"
```

---

### Task 2: Audit migrations, schema & security (main agent, direct)

**Files (read-only inspection, no modification):**
- All 26 files in `supabase/migrations/` (see list below)
- `supabase/functions/*`
- `packages/supabase/src/database.types.ts`
- `apps/web/src/proxy.ts`, `apps/web/src/lib/admin/auth.ts`
- `apps/web/.env.example`, `apps/mobile/.env.example` (or equivalent), `.gitignore`
- **Output:** append findings to Area 2 section of the report from Task 0.

Migration files (chronological):
```
20260302234254_remote_schema.sql
20260302234506_extensions_and_tables.sql
20260302235036_rls_and_indexes.sql
20260302235108_functions_and_rpcs.sql
20260303000241_triggers_and_storage.sql
20260305020526_handle_new_fix.sql
20260307000000_allow_user_upsert_inactive_city.sql
20260307000001_dish_type_entry_counts.sql
20260308145500_add_icon_to_dish_types.sql
20260308160000_comparisons_public_read.sql
20260308170000_add_icon_to_rpc_returns.sql
20260308180000_auto_populate_with_photos.sql
20260309000000_leaderboard_snapshot_system.sql
20260309010000_badge_system.sql
20260310000001_fix_upsert_restaurant_neighborhood.sql
20260310000002_add_location_properties_and_early_return.sql
20260311000000_optional_photos.sql
20260315000000_leaderboard_row_enhancements.sql
20260315100000_discover_rpcs_use_city_id.sql
20260316000000_content_reports.sql
20260318000000_fix_cascade_deletes_for_account_deletion.sql
20260405000000_content_reports_review_fields.sql
20260405000001_content_reports_admin_rls.sql
20260406000000_blocked_users.sql
20260407000001_remove_photo_placeholder_injection.sql
20260426000000_provider_aware_handle_new_user.sql
```

- [ ] **Step 1: Check for duplicate/conflicting timestamps or ordering gaps**

```bash
ls supabase/migrations | sort | uniq -d   # duplicate filenames
ls supabase/migrations | sort > /tmp/sorted_migrations.txt && diff /tmp/sorted_migrations.txt <(ls supabase/migrations)
```
Confirm alphabetical sort order matches chronological order (no manually
renamed timestamps). Any duplicate timestamp prefix is Critical (Supabase
applies migrations in filename order; a collision is undefined behavior).

- [ ] **Step 2: Confirm every table has RLS enabled**

```bash
grep -n "CREATE TABLE" supabase/migrations/*.sql
grep -n "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql
```
Cross-reference: every table created should have a corresponding
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` somewhere later in the history.
Any table without RLS enabled is Critical (default-open table, world
readable/writable via the anon/service key depending on grants).

- [ ] **Step 3: Spot-check RLS policies for overly permissive conditions**

```bash
grep -n "CREATE POLICY" supabase/migrations/*.sql
```
Read each policy's `USING`/`WITH CHECK` clause. Flag any policy with
`USING (true)` or no meaningful condition on a table containing user data
(should be scoped to `auth.uid()` or similar) as Critical. Flag admin-only
policies that don't check a role/claim as High.

- [ ] **Step 4: Check `database.types.ts` for drift against the migration history**

```bash
grep -n "content_reports\|blocked_users\|badge" packages/supabase/src/database.types.ts | head -20
```
Confirm tables/columns added in later migrations (`content_reports_review_fields`,
`blocked_users`, `badge_system`) are actually present in the generated
types file. Since there's no live DB to regenerate against in this audit,
this is a manual cross-check — record any table/column referenced in
migrations but absent from `database.types.ts` as High (apps will get
runtime errors or silently untyped `any` data).

- [ ] **Step 5: Check env var handling and secret hygiene**

```bash
git log --all --diff-filter=A -- "*.env" "*.env.local" "*.env.prod" 2>/dev/null
grep -rn "NEXT_PUBLIC_\|EXPO_PUBLIC_" apps/web/.env.example apps/mobile/.env.example 2>/dev/null
grep -rn "SERVICE_ROLE\|service_role" apps/web/src apps/mobile --include="*.ts" --include="*.tsx" | grep -v node_modules
```
Confirm no `.env*` files (other than `.env.example`) were ever committed.
Confirm the service-role key (if referenced anywhere) is never used in
client-reachable code — that's Critical if found in any file bundled to the
browser or the mobile app.

- [ ] **Step 6: Verify admin route gating**

Read `apps/web/src/proxy.ts` and `apps/web/src/lib/admin/auth.ts` in full.
Confirm: (a) every `/admin/*` route is actually covered by the proxy
matcher, (b) `requireAdmin()`/`getAdminUser()` checks a real role/claim
against the database rather than trusting a client-supplied value, (c)
there's no dev-only bypass left enabled. Any gap is Critical (unauthenticated
or under-authenticated access to the admin dashboard).

- [ ] **Step 7: Audit edge functions**

```bash
ls supabase/functions
```
For each function's `index.ts`, confirm it validates its caller (JWT check
or shared secret) and validates input shape before using it in a query.
Missing auth check on a function that mutates data is Critical; missing
input validation is High.

- [ ] **Step 8: Append all findings from Steps 1-7 to the report's Area 2 section, then commit**

```bash
git add docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md
git commit -m "docs: audit findings for migrations, schema & security"
```

---

### Task 3: Dispatch parallel subagents for Areas 3a, 3b, 4

**Files:**
- Create (scratch, not committed): `/private/tmp/claude-501/-Users-avi-workspace-forked-all-forked-monorepo/0c5d2997-62a5-469c-9f41-483725da9891/scratchpad/audit-web.md`, `audit-mobile.md`, `audit-cicd.md`

- [ ] **Step 1: Dispatch three `general-purpose` subagents in parallel, one per prompt below**

**Web app subagent prompt:**
```
Audit apps/web in this monorepo (forked-monorepo, a Next.js 16 App Router
marketing/admin app) for production readiness. Read apps/web/CLAUDE.md first
for the app's own conventions and hard rules. This is a read-only audit —
do not modify any files.

Check for:
1. Dead code / unused files (components, lib functions, routes never imported).
2. Lint/typecheck cleanliness: run `npm run lint -w forked-web` and
   `npm run typecheck -w forked-web` from the repo root
   (/Users/avi/workspace/forked-all/forked-monorepo) and report every
   warning/error, including whether react-hooks/purity and
   react-hooks/set-state-in-effect (documented as downgraded to warnings in
   the root README) are still firing anywhere.
3. Violations of apps/web/CLAUDE.md hard rules: no star symbols/word "star"
   for ratings, no hard-coded hex colors outside dark-only sections
   (Navbar/Footer/Hero/Mission/CTA), server-components-first (flag
   unnecessary "use client"), Supabase calls wrapped in try/catch with
   fallback data.
4. Test coverage — is there any test infrastructure at all? If none, note
   as a finding (severity: your judgment, but a 0-test admin dashboard
   handling user moderation/bans is at least Medium).
5. Leftover artifacts from the git-subtree import on 2026-06-10 (stale
   configs referencing the old standalone forked-web repo layout, orphaned
   files, an old package-lock.json — the root README says the tracked
   apps/web/package-lock.json was removed, confirm it's actually gone).

Report format: a flat list of findings, each as
`- [CRITICAL|HIGH|MEDIUM|LOW] <one-line summary> — \`path/to/file:line\``
followed by 2-4 sentences of explanation + recommendation. Write this list
to /private/tmp/claude-501/-Users-avi-workspace-forked-all-forked-monorepo/0c5d2997-62a5-469c-9f41-483725da9891/scratchpad/audit-web.md
and also return it in your final message.
```

**Mobile app subagent prompt:**
```
Audit apps/mobile in this monorepo (forked-monorepo, an Expo/React Native
SDK 54 dish-ranking app) for production readiness. Read apps/mobile/CLAUDE.md
first for the app's own conventions and hard rules. This is a read-only
audit — do not modify any files.

Check for:
1. Dead code / unused files (screens, hooks, components never imported).
2. Lint cleanliness: run `npm run lint -w forked` from the repo root
   (/Users/avi/workspace/forked-all/forked-monorepo) and report every
   warning/error. The root README documents that mobile ESLint was
   "silently broken" pre-merge (missing eslint-plugin-prettier/recommended)
   and 392 formatting errors were auto-fixed, plus a hook-order bug in
   dish-selection.tsx and a lowercase component in personal.tsx were fixed
   — confirm none of that class of issue has regressed.
3. Violations of apps/mobile/CLAUDE.md hard rules: no star symbols/word
   "star", no numeric score input, no useState/useEffect for server data
   (must use React Query), Pressable over TouchableOpacity, FlatList over
   ScrollView for lists, _layout.tsx files containing only navigation (no
   business logic), theme tokens used instead of hardcoded values.
4. Test coverage — CLAUDE.md states "No test suite configured." Confirm
   this is still true and note it as a finding (severity: your judgment
   given this handles payment-adjacent or user-generated content flows —
   check if it does).
5. Leftover artifacts from the git-subtree import on 2026-06-10 (stale
   configs referencing the old standalone `forked` repo layout, orphaned
   files, EAS/app.config.ts references to paths that no longer make sense
   in the monorepo).

Report format: a flat list of findings, each as
`- [CRITICAL|HIGH|MEDIUM|LOW] <one-line summary> — \`path/to/file:line\``
followed by 2-4 sentences of explanation + recommendation. Write this list
to /private/tmp/claude-501/-Users-avi-workspace-forked-all-forked-monorepo/0c5d2997-62a5-469c-9f41-483725da9891/scratchpad/audit-mobile.md
and also return it in your final message.
```

**CI/CD subagent prompt:**
```
Audit the CI/CD and build pipeline of this monorepo (forked-monorepo) for
production readiness. This is a read-only audit — do not modify any files.

Read and evaluate:
1. .github/workflows/ci.yml — does it actually gate on the right things
   (root README says it runs `npm ci` + `npm run lint` + `npm run
   typecheck` via Turborepo on pushes to main and all PRs)? Is there a
   build step? A test step? Does it run on the right branches/events? Is
   the Node version pinned to match `engines.node` (>=22.18) in the root
   package.json?
2. turbo.json — are task dependencies (`dependsOn`) and `outputs` correct
   for build/lint/typecheck so caching doesn't produce stale results?
3. apps/web deployment: check for a vercel.json or Vercel project settings
   file in the repo; confirm apps/web/next.config.ts transpilePackages
   setup matches what the root README's deployment section describes
   (Root Directory = apps/web, "Include source files outside of Root
   Directory" enabled).
4. apps/mobile/eas.json and apps/mobile/app.config.ts — sanity-check build
   profiles (development/preview/production) exist and reference correct
   values (bundle identifiers, env files per the root README's
   apps/mobile/.env.local + .env.prod convention).
5. Root package.json engines/packageManager/overrides — confirm these are
   consistent with what CI actually uses (does CI pin the same npm/node
   version?).

Report format: a flat list of findings, each as
`- [CRITICAL|HIGH|MEDIUM|LOW] <one-line summary> — \`path/to/file:line\``
followed by 2-4 sentences of explanation + recommendation. Write this list
to /private/tmp/claude-501/-Users-avi-workspace-forked-all-forked-monorepo/0c5d2997-62a5-469c-9f41-483725da9891/scratchpad/audit-cicd.md
and also return it in your final message.
```

- [ ] **Step 2: Wait for all three subagents to complete, then read their returned findings**

No commit for this task — subagents don't modify tracked files.

---

### Task 4: Synthesize final report

**Files:**
- Modify: `docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md`

- [ ] **Step 1: Paste the three subagents' findings into Area 3a, 3b, and Area 4 sections respectively**

- [ ] **Step 2: Deduplicate cross-area overlaps**

Specifically check: does the Area 1 `transpilePackages` finding (Task 1
Step 4) overlap with anything the CI/CD subagent found about Vercel config?
If so, merge into a single finding cross-referencing both, keep it in
Area 1, and note the cross-reference in Area 4 instead of repeating it.

- [ ] **Step 3: Write the Summary section**

Count findings by severity across all five inputs. List the top 3-5
Critical/High items as "top blockers" in prose (2-3 sentences each,
referencing the detailed entry below).

- [ ] **Step 4: Final read-through for internal consistency**

Confirm every finding has a real `file:line` reference (open the file and
check the line number is right — do not leave any finding with an
approximate or unverified location). Confirm severity levels are applied
consistently with the rubric in the design doc.

- [ ] **Step 5: Commit the completed report**

```bash
git add docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md
git commit -m "docs: complete monorepo production-readiness audit report"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers design Area 1, Task 2 covers Area 2,
  Task 3 covers Areas 3a/3b/4 via subagent, Task 4 covers the Summary +
  Deliverable format. All design-doc sections have a corresponding task.
- **No placeholders:** every step has literal commands, literal file paths,
  or a fully self-contained subagent prompt (subagents get zero prior
  context, so their prompts restate CLAUDE.md rules explicitly rather than
  assuming they've read this plan).
- **Consistency:** the finding format
  (`- [SEVERITY] summary — \`file:line\`` + explanation) is the same string
  used in Task 0's skeleton note, each task's steps, and the subagent
  prompts.
