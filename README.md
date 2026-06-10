# Forked Monorepo

npm-workspaces monorepo for the Forked apps, sharing one Supabase backend.

```
apps/
  mobile/              # Expo / React Native app (was github.com/avinash797/forked)
  web/                 # Next.js marketing + admin app (was github.com/avinash797/forked-web)
packages/
  supabase/            # @forked/supabase — shared DB types, RPC types, client factories
supabase/              # Single Supabase project: config.toml, migrations, edge functions
```

## Setup

```bash
npm install            # installs all workspaces from the repo root
```

Env files are per app and not committed:

- `apps/mobile/.env.local` (+ `.env.prod`) — `EXPO_PUBLIC_*` vars
- `apps/web/.env.local` — `NEXT_PUBLIC_*` vars

See the `.env.example` in each app.

## Day-to-day commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run start:mobile` / `npm run ios` / `npm run android` | Expo dev workflows |
| `npm run dev:web` | Next.js dev server |
| `npm run build:web` | Next.js production build |
| `npm run typecheck` / `npm run lint` | All workspaces |
| `npm run db:start` / `db:reset` / `db:push` | Supabase local stack / reset / push to linked project |
| `npm run db:migration -- <name>` | Create a new migration file |
| `npm run gen:types` | Regenerate `packages/supabase/src/database.types.ts` from the local DB |
| `npm run gen:types:remote` | Same, from the linked remote project |

## Shared Supabase layer (`@forked/supabase`)

Single source of truth for everything DB-shaped:

- `@forked/supabase` (or `/database.types`, `/rpc.types`, `/badge.types`) — generated `Database` types plus hand-written RPC/badge types.
- `@forked/supabase/native` — `createNativeClient(url, key)`: supabase-js client with AsyncStorage persistence for the Expo app.
- `@forked/supabase/web` — `createBrowserSupabaseClient` and `createStaticSupabaseClient` for Next.js client components / build-time code.
- `@forked/supabase/server` — `createServerSupabaseClient(url, key, cookieHandlers)`: framework-agnostic SSR client; the web app injects Next.js cookie handlers (see `apps/web/src/lib/supabase/server.ts` and `middleware.ts`).

The old per-app type files (`apps/mobile/types/*.types.ts`, `apps/web/src/types/*.types.ts`)
still exist as re-export shims so existing `@/types/...` imports keep working. The web app's
`sync-types` copy script is gone.

Env vars are intentionally read in the apps (not the package): `EXPO_PUBLIC_*` /
`NEXT_PUBLIC_*` inlining only applies to app source.

## Migration workflow

One `supabase/` directory at the root — no more per-app migration drift.

```bash
npm run db:migration -- my_change   # create supabase/migrations/<ts>_my_change.sql
npm run db:reset                    # replay all migrations locally
npm run gen:types                   # refresh shared types
npm run db:push                     # push to the linked remote when ready
```

Run `supabase link --project-ref <ref>` once at the repo root. Before the first
`db push`, verify the merged history matches the remote with `supabase migration list`
(this folder is the union of the old `forked` and `forked-web` migration folders).

## Deployment

### Web — Vercel

In the Vercel project settings:

1. Point the project at the monorepo repository.
2. Set **Root Directory** to `apps/web` (keep "Include source files outside of the
   Root Directory" enabled — it's the default).

Vercel detects npm workspaces, installs from the repo root, and builds with the
workspace's `npm run build`. `transpilePackages: ["@forked/supabase"]` in
`next.config.ts` compiles the shared package.

### Mobile — Expo / EAS

Run EAS from the app directory; EAS detects the workspace root and uploads the
whole monorepo:

```bash
cd apps/mobile
eas build --profile <development|preview|production>
```

`eas.json` and `app.config.ts` are unchanged. Expo SDK 54's Metro config
auto-detects the monorepo (verified via `npx expo export`).

## Notes from the migration (2026-06-10)

- Imported with full git history from `forked@improvement/sso` and
  `forked-web@feature/additional-admin-features` via `git subtree add`.
- `database.types.ts` came from the web app (newer — content-report review fields);
  `rpc.types.ts` is the union of both apps' copies (web was missing
  `LeaderboardEntry.neighborhood_name`, mobile was missing the admin analytics types).
- `react` is pinned to 19.1.0 (Expo SDK 54's version) for the whole tree; the web app
  was moved from 19.2.3 so only one React is ever hoisted.
- The `@react-native-async-storage/async-storage` override moved to the root
  `package.json` (npm only honors overrides at the install root).
- The old `forked-db/` folder was NOT merged: its two `remote_schema` dumps overlap
  the incremental migrations and would conflict. Its `local_backup/` storage dumps
  also stayed behind.
