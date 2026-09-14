# Supabase environments

Three databases, one migrations folder.

| Environment | Where | Project ref | Used by |
|---|---|---|---|
| **local** | Docker on your machine (`npm run db:start`) | — | Day-to-day schema work. Free, instant, safe to wipe. |
| **dev** | Supabase project `Forked (dev)` | `bqxhinoabxmpsvzntrlq` | Device builds, shared test data, anything that needs a real URL. Safe to wipe. |
| **prod** | Supabase project `Forked-prod` | `wiuuouqkpfwpyudayagc` | Real users. Never reset, never seeded. |

The mapping lives in **`supabase/projects.env`** and nowhere else. Change it there and every
script follows.

Cost: the Supabase Free plan allows **two active projects** across all orgs where you are
owner/admin, so dev + prod is $0. Free projects pause after ~7 days of low activity; a paused
project doesn't count against the two. That's fine for dev (resume it from the dashboard when
you need it) but means prod will pause too if the app is quiet — resume it or move prod to Pro
before launch.

## One-time steps (do these before the first push)

The migrations folder was rebuilt on 2026-09-13: `supabase/migrations/` now holds the exact SQL
recorded in the dev project's migration history (the consolidated `draft_*` schema), and the 26
pre-rebuild files moved to `supabase/legacy-migrations/` — kept for reference, never replayed.
Local files and dev's recorded history match version-for-version, so no `migration repair` is
needed. `20260913225212` is a deliberate no-op placeholder; read the comment at the top of it
before you touch it.

Already done: `Forked-prod` has been resumed, and `apps/mobile/.env.prod` points at it.

1. **Credentials** — the only blocker for pushing anything.

   ```bash
   cp supabase/.env.dev.example  supabase/.env.dev
   cp supabase/.env.prod.example supabase/.env.prod
   ```

   Paste the Session pooler connection string for each project (Dashboard → Connect), password
   included. These are the database passwords; nothing else in this repo can supply them.

2. **Verify the baseline replays from zero** (needs Docker running):

   ```bash
   npm run db:start && npm run db:reset && npm run gen:types && npm run typecheck
   ```

   The 11 baseline migrations are byte-identical to what applied cleanly to an empty `public`
   schema on dev, so this is a confirmation rather than a discovery.

3. **First prod push.**

   ```bash
   npm run db:check:prod       # expect an empty remote history
   npm run db:push:prod:dry    # expect all 12 versions pending
   npm run db:push:prod        # type PROD
   ```

4. **Web prod config** — set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the
   prod values in Vercel's project settings. They deliberately do not live in this repo.

5. **CI secrets** — create GitHub Environments `dev`, `prod` and `prod-readonly`, each with a
   `SUPABASE_DB_URL` secret, and turn on required reviewers for `prod`.

## The rule that prevents accidents

**This repo is never `supabase link`ed.**

A link writes one "current project" into `supabase/.temp/project-ref`, and from then on every
bare `supabase db push` targets whatever you linked last. That is the exact mistake you can't
train yourself out of. Instead, every command names its target:

```bash
npm run db:push:dev          # -> scripts/supabase-env.sh dev db push
npm run db:push:prod         # -> scripts/supabase-env.sh prod db push
```

`scripts/supabase-env.sh` resolves `dev`/`prod` to a project and passes it explicitly
(`--db-url` for database commands, `--project-ref`/`--project-id` for platform commands).
It also:

- **refuses to run while a link file exists** — so if something links the repo, bare CLI
  commands fail loudly instead of guessing;
- **requires you to type `PROD`** before anything non-dry-run touches production;
- **refuses prod from a non-interactive shell** unless `CI=true` (fail closed);
- **hard-blocks `db reset` and `--include-seed` against prod**, always.

There is no ambiguous state to forget to switch back. Nothing is "currently selected".

```bash
npm run supabase:status      # what is dev, what is prod, what each env file points at
```

Run that whenever you're about to do something irreversible.

## Setup (once per machine)

```bash
cp supabase/.env.dev.example  supabase/.env.dev
cp supabase/.env.prod.example supabase/.env.prod
```

Fill each with the **Session pooler** connection string from Dashboard → project → Connect
(password included — the session pooler is IPv4-safe, unlike the direct `db.<ref>` host).
Both files are gitignored. Use a different database password for prod than for dev.

## Daily workflow

```bash
npm run db:start                     # local stack
npm run db:migration -- add_thing    # new migration file
# edit supabase/migrations/<ts>_add_thing.sql
npm run db:reset                     # replay everything locally, incl. seeds
npm run gen:types                    # types from the LOCAL db
npm run typecheck
```

Nothing above can reach a remote project. When local is green:

```bash
npm run db:push:dev:dry              # what would change on dev
npm run db:push:dev                  # apply to dev
```

Then build/test the apps against dev. Only after that:

```bash
npm run db:push:prod:dry             # what would change on prod — read this
npm run db:push:prod                 # type PROD to confirm
```

Better still, don't push to prod from your laptop at all: run the **Database migrations**
workflow in GitHub Actions (`.github/workflows/db-migrate.yml`) with target `prod`, mode
`apply`. Put the prod connection string in the `prod` GitHub Environment and turn on required
reviewers there; then prod migrations are an approval with an audit trail, and a mistyped
local command has nothing to hit.

### Other scoped commands

```bash
npm run db:check:dev  / db:check:prod    # local migrations vs. remote history
npm run db:reset:dev                      # wipe dev and replay all migrations (dev only)
npm run gen:types:dev                     # types from dev instead of local
npm run fn:deploy:dev  / fn:deploy:prod   # edge functions
npm run sb -- prod functions list         # escape hatch: any CLI command, explicit env
```

`npm run db:push` and `npm run gen:types:remote` were removed on purpose — they acted on
"whatever is linked". They now fail with a pointer here.

## Which project the apps talk to

| File | Points at | Notes |
|---|---|---|
| `apps/mobile/.env.local` | dev (or local stack) | Expo reads this for `npm run start:mobile` |
| `apps/mobile/.env.prod` | **prod** | Production EAS builds only |
| `apps/web/.env.local` | dev | Local `npm run dev:web` |
| Vercel project env vars | **prod** | Web prod config lives in Vercel, not in the repo |

`npm run supabase:status` prints what each file actually points at, resolved to dev/PROD by
ref, so a wrong value is visible rather than inferred.

## Promoting to prod: checklist

1. `npm run db:reset` locally — migrations replay clean from zero.
2. `npm run db:push:dev` and exercise the apps against dev.
3. `npm run db:check:prod` — confirm prod history is what you expect.
4. `npm run db:push:prod:dry` — read every statement.
5. Apply via the GitHub Actions workflow (preferred) or `npm run db:push:prod`.
6. `npm run fn:deploy:prod <name>` for any changed edge function.
7. Set prod secrets/config in the dashboard — `config.toml` is local-stack config and does
   not push itself to a remote project.
8. Rebuild the mobile app against `.env.prod` if the client needs the new schema.

## Never do this

- `supabase link` (the whole point).
- `supabase db reset --linked` or `--include-seed` anywhere near prod — the wrapper blocks
  both, so blocked means "you targeted prod", not "the tool is broken".
- Editing prod schema in the dashboard SQL editor. It creates drift the migrations folder
  can't see. If it happens: `npm run sb -- prod db pull` and commit the result.
- Copying the prod connection string into `supabase/.env.dev`.
