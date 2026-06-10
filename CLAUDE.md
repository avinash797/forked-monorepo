# Forked Monorepo

npm workspaces. See README.md for full setup/build/deploy docs.

- `apps/mobile` — Expo app. Has its own CLAUDE.md.
- `apps/web` — Next.js marketing/admin app. Has its own CLAUDE.md.
- `packages/supabase` — `@forked/supabase`: shared Database/RPC types + client factories. This is the only place DB types live; the per-app `types/*.types.ts` files are re-export shims.
- `supabase/` — the single Supabase project (config, migrations, edge functions). Never add migrations inside an app.

Rules:

- Schema changes → migration in root `supabase/migrations/` (`npm run db:migration -- <name>`), then `npm run gen:types`.
- Run npm commands from the repo root with `-w forked` (mobile) or `-w forked-web` (web), or use the root scripts.
- `react` stays pinned at the Expo SDK's exact version across the whole tree (root hoisted, no per-app react).
- npm `overrides` live only in the root package.json.
