# Forked Monorepo

npm-workspaces + Turborepo monorepo for the Forked apps, sharing one Supabase backend
and a set of shared packages (design tokens, domain types, utilities).

```
apps/
  mobile/              # Expo / React Native app (was github.com/avinash797/forked)
  web/                 # Next.js marketing + admin app (was github.com/avinash797/forked-web)
packages/
  supabase/            # @forked/supabase — generated DB/RPC types, client factories
  types/               # @forked/types — shared domain types built on the DB types
  theme/               # @forked/theme — design tokens (scales + palettes + generated theme.css)
  utils/               # @forked/utils — shared logic (score tiers, validators, constants)
  typescript-config/   # @forked/typescript-config — shared tsconfig bases
supabase/              # config.toml, migrations, edge functions — one folder, three DBs (local/dev/prod)
```

## Setup

```bash
npm install            # installs all workspaces from the repo root
```

Requires Node >= 22.18 (the theme CSS generator uses built-in TS type stripping).

Env files are per app and not committed:

- `apps/mobile/.env.local` (+ `.env.prod`) — `EXPO_PUBLIC_*` vars
- `apps/web/.env.local` — `NEXT_PUBLIC_*` vars

See the `.env.example` in each app.

## Day-to-day commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run start:mobile` / `npm run ios` / `npm run android` | Expo dev workflows |
| `npm run dev:web` | Next.js dev server |
| `npm run build` | Turborepo build (all workspaces with a build script) |
| `npm run build:web` | Next.js production build only |
| `npm run typecheck` / `npm run lint` | All workspaces via Turborepo (cached) |
| `npm run db:start` / `db:reset` | Supabase local stack / reset it |
| `npm run db:migration -- <name>` | Create a new migration file |
| `npm run gen:types` | Regenerate `packages/supabase/src/database.types.ts` from the local DB |
| `npm run gen:types:dev` | Same, from the dev project |
| `npm run supabase:status` | Which project is dev, which is prod, what each env file points at |
| `npm run db:push:dev` / `db:push:prod` | Apply migrations to a named remote project (prod asks you to type `PROD`) |
| `npm run gen:theme` | Regenerate `packages/theme/theme.css` from the web palette + scales |

## Shared packages

### `@forked/supabase`

Single source of truth for everything DB-shaped:

- `@forked/supabase` (or `/database.types`, `/rpc.types`, `/badge.types`) — generated `Database` types plus hand-written RPC/badge types.
- `@forked/supabase/native` — `createNativeClient(url, key)`: supabase-js client with AsyncStorage persistence for the Expo app.
- `@forked/supabase/web` — `createBrowserSupabaseClient` and `createStaticSupabaseClient` for Next.js client components / build-time code.
- `@forked/supabase/server` — `createServerSupabaseClient(url, key, cookieHandlers)`: framework-agnostic SSR client; the web app injects Next.js cookie handlers (see `apps/web/src/lib/supabase/server.ts` and `middleware.ts`).

Env vars are intentionally read in the apps (not the package): `EXPO_PUBLIC_*` /
`NEXT_PUBLIC_*` inlining only applies to app source.

### `@forked/types`

Shared domain types built on the DB types: `Restaurant`, `DishType`,
`DishTypeVariation`, `TasteTag`, `UserProfile`, auth shapes, etc. Import the
subpaths (`@forked/types/restaurant`, `/dishes`, `/auth`, `/taste-tags`) when
two modules export a same-named type.

### `@forked/theme`

Design tokens. `scales` (spacing/radius/typography/shadows) are shared by both
apps; color palettes are per app (`mobilePalette`, `webPalette` — they diverged
pre-merge and are kept verbatim; converging them is a one-file design decision).

- Mobile assembles its theme object in `apps/mobile/lib/theme/index.ts` from the palette + scales.
- Web imports the **generated** `@forked/theme/theme.css` in `globals.css` and maps the
  CSS custom properties into Tailwind v4 via `@theme inline`.
- Edit tokens in `packages/theme/src/`, then `npm run gen:theme`. Never edit `theme.css` by hand.

### `@forked/utils`

Cross-app logic: score tiers + `formatScore` (the green/amber/red ≥7.0/≥4.0
bands used by both ScoreBadge components), confidence tiers + labels,
form validators, `US_STATES`.

### `@forked/typescript-config`

`base.json`, `nextjs.json`, `react-native.json`, `library.json`. Each app and
package extends one of these instead of rolling its own compiler options.

All shared packages are consumed as TypeScript source (no build step): Metro
transpiles them for mobile, and `transpilePackages` in `next.config.ts` covers
the web app. Adding a new shared package means: create `packages/<name>` with
`"main": "./src/index.ts"`, add it to the consuming app's `dependencies` (`"*"`),
and append it to `transpilePackages`.

## Migration workflow

One `supabase/` directory at the root — no per-app migration drift.

```bash
npm run db:migration -- my_change   # create supabase/migrations/<ts>_my_change.sql
npm run db:reset                    # replay all migrations locally
npm run gen:types                   # refresh shared types
npm run db:push                     # push to the linked remote when ready
```

There are two remote projects — `dev` and `prod` — and this repo is deliberately **never
linked** to either: every command names its target, so there is no "current project" to
forget to switch back. See **`supabase/ENVIRONMENTS.md`** for the full workflow, and run
`npm run supabase:status` before anything irreversible.

```bash
npm run db:push:dev:dry             # preview against dev
npm run db:push:dev                 # apply to dev
npm run db:push:prod:dry            # preview against prod
npm run db:push:prod                # apply to prod (type PROD to confirm)
```

## CI

`.github/workflows/ci.yml` runs `npm ci` + `npm run lint` + `npm run typecheck`
(all workspaces, via Turborepo) on pushes to `main` and all PRs.

## Deployment

### Web — Vercel

In the Vercel project settings:

1. Point the project at the monorepo repository.
2. Set **Root Directory** to `apps/web` (keep "Include source files outside of the
   Root Directory" enabled — it's the default).

Vercel detects npm workspaces, installs from the repo root, and builds with the
workspace's `npm run build`. `transpilePackages` in `next.config.ts` compiles the
shared packages.

### Mobile — Expo / EAS

Run EAS from the app directory; EAS detects the workspace root and uploads the
whole monorepo:

```bash
cd apps/mobile
eas build --profile <development|preview|production>
```

`eas.json` and `app.config.ts` are unchanged. Expo SDK 57's Metro config
auto-detects the monorepo (verified via `npx expo export`).

## Notes from the migrations

### 2026-06-12 — shared packages reorganization

- Added `@forked/theme`, `@forked/types`, `@forked/utils`, `@forked/typescript-config`;
  deleted the per-app type shims (`apps/*/…/types/*`) — all imports now go straight
  to the shared packages.
- Web design tokens moved out of `globals.css` into the generated
  `@forked/theme/theme.css` (values unchanged). The stale, unused
  `apps/web/src/lib/theme/tokens.ts` was deleted.
- Added Turborepo for `build`/`lint`/`typecheck` orchestration + caching.
- Removed the tracked `apps/web/package-lock.json`; the root lockfile is the only one.
- Mobile ESLint was silently broken (`prettier/prettier` rule without the plugin);
  fixed by registering `eslint-plugin-prettier/recommended`, then resolved the
  backlog it surfaced (392 formatting errors auto-fixed; hook-order bug in
  `dish-selection.tsx`; lowercase component in `personal.tsx`; unescaped JSX entities).
- Web: React Compiler lint rules (`react-hooks/purity`, `react-hooks/set-state-in-effect`)
  downgraded to warnings until the flagged components are restructured.

### 2026-06-10 — repo merge

- Imported with full git history from `forked@improvement/sso` and
  `forked-web@feature/additional-admin-features` via `git subtree add`.
- `database.types.ts` came from the web app (newer — content-report review fields);
  `rpc.types.ts` is the union of both apps' copies.
- `react` is pinned to 19.1.0 (Expo SDK 54's version) for the whole tree.
- The `@react-native-async-storage/async-storage` override moved to the root
  `package.json` (npm only honors overrides at the install root).
- The old `forked-db/` folder was NOT merged: its two `remote_schema` dumps overlap
  the incremental migrations. Its `local_backup/` storage dumps also stayed behind.
