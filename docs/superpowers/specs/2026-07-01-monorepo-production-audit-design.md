# Monorepo Production-Readiness Audit — Design

## Context

The `apps/mobile` (formerly `forked`) and `apps/web` (formerly `forked-web`) repos
were merged into this monorepo via `git subtree` on 2026-06-10, followed by a
shared-packages reorganization on 2026-06-12 (see README.md "Notes from the
migrations"). The project is **pre-launch** — no real users or production data
yet. Before taking it to production, we want a full audit to catch anything
left over from the merge (drift, duplication, dead code) plus general
production-readiness gaps.

## Goal

Produce a single, severity-tagged findings report covering the whole monorepo.
This phase is **audit-only** — no code changes, no migrations applied, no
fixes. The user reviews and prioritizes the report; fixes happen in a
follow-up implementation pass.

Because the project is pre-launch, findings are free to recommend breaking
schema/API changes — no backward-compatibility hedging is needed in
recommendations.

## Scope: Four Areas

### 1. Shared packages & type duplication
`packages/supabase`, `packages/types`, `packages/theme`, `packages/utils`,
`packages/typescript-config`.

Check for:
- Duplicate types/constants that exist in both apps but should live in a
  shared package (or vice versa — dead shared exports nobody imports).
- Completeness of `transpilePackages` in `apps/web/next.config.ts` against
  the actual set of shared packages.
- The known pre-merge palette divergence (`mobilePalette` vs `webPalette` in
  `packages/theme`) — confirm it's intentional and documented, not accidental
  drift.
- tsconfig base correctness — each app/package extends the right
  `@forked/typescript-config` base.
- Any leftover per-app type shims that should have been deleted in the
  2026-06-12 reorg but weren't.

### 2. Migrations, schema & security
`supabase/migrations`, `supabase/functions`, RLS policies, auth flows.

Check for:
- Integrity of the merged migration history (union of two repos' migration
  folders per README) — duplicate/conflicting timestamps, ordering gaps,
  migrations that assume state from the other app's history.
- RLS policy presence and correctness on every table (default-deny posture,
  no accidental open tables).
- Whether `packages/supabase/src/database.types.ts` actually matches the
  current migration history (type drift).
- Secrets/env handling — nothing committed, correct `NEXT_PUBLIC_*` /
  `EXPO_PUBLIC_*` boundaries (only truly public values inlined).
- Admin-route auth gating (`apps/web/src/proxy.ts` + `lib/admin/auth.ts`).
- Edge function security (auth checks, input validation, secrets usage).

### 3. App-level code health (web + mobile)
Each app audited independently against its own `CLAUDE.md` rules.

Check for:
- Dead code, unused files.
- Lint/typecheck cleanliness — README notes React Compiler rules
  (`react-hooks/purity`, `react-hooks/set-state-in-effect`) were downgraded to
  warnings "until flagged components are restructured" — check whether that's
  still deferred debt and how much.
- Violations of each app's hard rules (e.g., mobile: no star symbols, no
  numeric score input, no `useState`/`useEffect` for server data; web: no
  hard-coded hex colors outside dark-only sections, server-components-first).
- Test coverage gaps (mobile has none per its CLAUDE.md — assess risk).
- Leftover artifacts from the `git subtree` import (stale configs, orphaned
  files, references to the old standalone-repo layout).

### 4. CI/CD & build pipeline
`.github/workflows/ci.yml`, `turbo.json`, Vercel config, `apps/mobile/eas.json`.

Check for:
- Whether CI actually gates on the right things (lint, typecheck — does it
  need build/test too?).
- Turborepo cache config correctness (task dependencies, outputs).
- Vercel root-directory / transpilePackages setup sanity (cross-check against
  area 1 findings).
- EAS build profile sanity.

## Severity Rubric

- **Critical** — would break production or leak data/secrets.
- **High** — will cause bugs, or violates a hard rule stated in a CLAUDE.md.
- **Medium** — tech debt that increases risk over time but isn't actively
  broken.
- **Low** — cosmetic/consistency nit.

## Execution Plan (hybrid)

- **I audit personally:** Area 1 (shared packages) and Area 2 (migrations/
  schema/security) — these require cross-referencing both apps at once to
  judge duplication and drift correctly.
- **Parallel subagents:** Area 3 web, Area 3 mobile, and Area 4 (CI/CD) — each
  is large but self-contained; a subagent can go deep on one without needing
  full context on the others.
- **Synthesis:** I merge all findings into one report, deduplicate overlaps
  (e.g., a `transpilePackages` issue might surface from both Area 1 and Area
  4), and order by severity within each area.

## Deliverable

A single markdown report at
`docs/superpowers/specs/2026-07-01-monorepo-production-audit-report.md`,
structured as:

```
# Monorepo Production-Readiness Audit

## Summary (counts by severity, top 3-5 blockers)

## Area 1: Shared Packages
- [CRITICAL|HIGH|MEDIUM|LOW] <one-line summary> — `path/to/file:line`
  <2-4 sentence explanation + recommendation>
...

## Area 2: Migrations, Schema & Security
...

## Area 3a: Web App
...

## Area 3b: Mobile App
...

## Area 4: CI/CD & Build
...
```

## Out of Scope (this phase)

- Applying any fixes, migrations, or refactors.
- Runtime/manual QA testing of either app (no dev servers launched).
- Performance profiling or load testing.
- Third-party service audits (Vercel/Supabase account settings, billing,
  Expo/EAS account config) beyond what's visible in the repo.
