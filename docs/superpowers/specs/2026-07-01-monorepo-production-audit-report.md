# Monorepo Production-Readiness Audit

_Audit of the forked-monorepo prior to production launch. See design doc:
[2026-07-01-monorepo-production-audit-design.md](./2026-07-01-monorepo-production-audit-design.md)._

## Summary

<!-- filled in last: counts by severity, top 3-5 blockers -->

## Area 1: Shared Packages

- [MEDIUM] `apps/web` and `apps/mobile` extend `@forked/typescript-config` but never declare it as a dependency — `apps/web/package.json`, `apps/mobile/package.json` (both extend it from `apps/web/tsconfig.json:1` and `apps/mobile/tsconfig.json:4`, but neither `package.json` lists `"@forked/typescript-config"`). Every `packages/*` workspace declares it correctly (e.g. `packages/theme/package.json:17`). It resolves today only because npm hoists all workspace packages into the root `node_modules/@forked/*` regardless of which workspace actually depends on them — confirmed the symlink exists at `node_modules/@forked/typescript-config` with no corresponding dependency entry. Add the explicit devDependency to both apps so the contract doesn't rely on hoisting behavior.

- [MEDIUM] Mobile re-derives the `Restaurant` row type locally instead of importing the shared one — `apps/mobile/app/(protected)/(rating)/create-venue.tsx:17`, `apps/mobile/app/(protected)/(rating)/index.tsx:16`, `apps/mobile/stores/use-rating-store.ts:5`, `apps/mobile/hooks/use-restaurants.ts:5`, `apps/mobile/hooks/use-venue-search.ts:20`. Each does `type Restaurant = Database['public']['Tables']['restaurants']['Row']`, which is exactly what `@forked/types` already exports as `RawRestaurant` (`packages/types/src/restaurant.ts:4`). Functionally safe today (both derive from the same `Database` type so they can't drift in shape), but it's five places to touch if this ever needs the augmented `location_properties` field the shared `Restaurant` type adds, and it's the duplication pattern the root CLAUDE.md explicitly warns against. Recommend importing `RawRestaurant` from `@forked/types` in all five files.

- [LOW] Dead, vestigially-named "star" theme tokens in the mobile palette — `packages/theme/src/palettes.ts:56-62` (dark) and `:105-111` (light), surfaced via `apps/mobile/lib/theme/index.ts:12` (`rating: t.mode[mode].rating`). Nothing in `apps/mobile` reads `theme.rating.*` (`starFilled`, `starEmpty`, `top1/2/3` — verified via repo-wide grep, zero hits). `apps/mobile/CLAUDE.md` has a hard rule against star symbols/the word "star" for ratings; these look like leftover tokens from a pre-pivot design and should be deleted rather than carried into production. Not urgent since they're inert, but worth cleaning up alongside other dead-code removal.

- No other findings for Area 1: `transpilePackages` in `apps/web/next.config.ts:4-9` correctly lists all four runtime shared packages; the `mobilePalette`/`webPalette` divergence is intentional and documented (`packages/theme/src/palettes.ts:1-8`) and each app imports only its own palette; `theme.css` matches what `generate-css.ts` would currently produce (not stale); no orphaned per-app type shims or stray `package-lock.json` files remain from the pre-merge repos; tsconfig `extends` chains are otherwise correct (web → `nextjs.json`, mobile → `react-native.json` + `expo/tsconfig.base`, packages → `library.json`).

## Area 2: Migrations, Schema & Security

## Area 3a: Web App

## Area 3b: Mobile App

## Area 4: CI/CD & Build
