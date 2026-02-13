# CLAUDE.md — Forked Web Companion App

## Project Overview

This is the **web companion** for the Forked mobile app (Expo/React Native). It provides marketing pages, SEO-optimized leaderboard content, and will eventually include a blog and admin dashboard.

**Tech Stack:**
- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS v4** with CSS custom properties from shared design tokens
- **Supabase** (shared backend with mobile app) via `@supabase/ssr`
- **@tanstack/react-query** for data fetching
- **Deployment:** Vercel

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (also generates sitemap)
npm run lint       # ESLint
npm run sync-types # Copy database.types.ts from mobile app
```

## Architecture

- `src/app/` — Next.js App Router pages
- `src/components/` — Reusable UI and section components
- `src/lib/` — Supabase clients, theme tokens, SEO helpers
- `src/types/` — Shared TypeScript types (synced from mobile app)

## Git Workflow Rules

### Branch Strategy
- `main` = **production**. Only receives merges from `development`.
- `development` = **integration**. Priority branches merge here when complete.
- Each priority phase (P0-P9) **must** be developed on its own branch.
- Branch naming: `p<N>/<short-kebab-description>`
- When starting a new priority: `git checkout -b p<N>/<description> development`
- When complete: merge into `development` and push.
- Never commit priority work directly to `development` or `main`.

### Commit Strategy
- Each **task** within a priority **must** be its own commit.
- Commit message format: `P<N>: <imperative summary>`
- Every commit must leave the project in a buildable state.
- Do not bundle unrelated changes into one commit.

### Merge & Cleanup
- After merging a priority branch to `development`, push `development` to origin.
- PRs from `development` -> `main` are done for production releases.
- Do not delete remote branches.

## Design Token Source

Design tokens come from `forked/lib/theme/token.default.ts`. CSS custom properties are defined in `globals.css` and mapped to Tailwind's theme via `@theme inline`. See `src/lib/theme/tokens.ts` for the TypeScript mapping.

## Supabase Integration

- Browser client: `src/lib/supabase/client.ts` (cookie-based via `@supabase/ssr`)
- Server client: `src/lib/supabase/server.ts` (reads cookies from `next/headers`)
- Same database, RPC functions, and anon key as the mobile app
- Key RPCs: `get_leaderboard`, `get_leaderboard_with_tiebreakers`
