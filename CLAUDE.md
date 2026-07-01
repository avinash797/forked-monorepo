# Forked Monorepo

npm workspaces + Turborepo. See README.md for full setup/build/deploy docs.

- `apps/mobile` — Expo app. Has its own CLAUDE.md.
- `apps/web` — Next.js marketing/admin app. Has its own CLAUDE.md.
- `packages/supabase` — `@forked/supabase`: generated Database/RPC types + client factories. The only place DB types live.
- `packages/types` — `@forked/types`: shared domain types (Restaurant, DishType, TasteTag, auth shapes) built on the DB types.
- `packages/theme` — `@forked/theme`: design tokens. Scales (space/radius/font) shared by both apps; color palettes per app (`mobilePalette`, `webPalette`). `theme.css` is generated — never edit it by hand.
- `packages/utils` — `@forked/utils`: shared logic (score tiers/formatting, confidence tiers, validators, US states).
- `packages/typescript-config` — shared tsconfig bases (apps/packages extend these).
- `supabase/` — the single Supabase project (config, migrations, edge functions). Never add migrations inside an app.

Rules:

- Schema changes → migration in root `supabase/migrations/` (`npm run db:migration -- <name>`), then `npm run gen:types`.
- Theme/token changes → edit `packages/theme/src/`, then `npm run gen:theme` if the web palette or scales changed.
- Never duplicate a type or constant across apps — put it in `@forked/types` / `@forked/utils`.
- New shared packages must be added to `transpilePackages` in `apps/web/next.config.ts`.
- `npm run lint` / `typecheck` / `build` at the root run through Turborepo for all workspaces.
- Run npm commands from the repo root with `-w forked` (mobile) or `-w forked-web` (web), or use the root scripts.
- `react` stays pinned at the Expo SDK's exact version across the whole tree (root hoisted, no per-app react).
- npm `overrides` live only in the root package.json; the root `package-lock.json` is the only lockfile.
