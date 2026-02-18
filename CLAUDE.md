# CLAUDE.md — Forked Web Companion App

## Project Overview

This is the **web companion** for the Forked mobile app (Expo/React Native). It provides a marketing landing page, SEO-optimized public leaderboard pages, and will eventually include a blog CMS and admin dashboard.

Both the mobile app and this web app share the same **Supabase** backend (database, RPC functions, storage).

**Tech Stack:**

- **Next.js 16** (App Router) with TypeScript (strict mode)
- **Tailwind CSS v4** with CSS custom properties mapped from shared design tokens
- **Supabase** via `@supabase/ssr` (cookie-based auth for server/client components)
- **@tanstack/react-query** (available but not yet used — server components fetch directly)
- **Deployment target:** Vercel

## Development Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build (also generates sitemap via postbuild)
npm run start      # Serve production build locally
npm run lint       # ESLint
```

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout: fonts, metadata, JSON-LD (WebSite + Organization)
│   ├── page.tsx                   # Landing page — 7 sections, ISR 10min
│   ├── globals.css                # Design tokens (CSS vars) + Tailwind @theme inline
│   │
│   ├── (marketing)/               # Route group with shared Navbar + Footer layout
│   │   ├── layout.tsx
│   │   ├── about/page.tsx
│   │   └── how-it-works/page.tsx
│   │
│   ├── admin/                     # Protected admin dashboard
│   │   ├── layout.tsx             # Admin layout: sidebar (256px) + header + content area
│   │   ├── page.tsx               # Dashboard: metric cards + recent activity
│   │   ├── blog/                  # Blog CRUD with TipTap editor
│   │   │   ├── page.tsx           # Post list with status filters, search, pagination
│   │   │   ├── new/page.tsx       # Create new post
│   │   │   └── [id]/edit/page.tsx # Edit existing post
│   │   ├── users/                 # User management
│   │   │   ├── page.tsx           # User list with search and filters
│   │   │   └── [id]/page.tsx      # User detail + moderation actions
│   │   ├── moderation/            # Content moderation
│   │   │   ├── page.tsx           # Flag overview with resolve/dismiss
│   │   │   ├── photos/page.tsx    # Photo review grid
│   │   │   └── restaurants/page.tsx # Restaurant verify/close tools
│   │   └── analytics/page.tsx     # Recharts visualizations + leaderboard health
│   │
│   ├── auth/                      # Authentication routes
│   │   ├── login/page.tsx         # Email/password login, dark branded styling
│   │   └── callback/route.ts      # Exchange auth code for session
│   │
│   ├── leaderboard/               # Public leaderboard pages
│   │   ├── page.tsx               # Hub — lists active cities
│   │   ├── [city]/page.tsx        # City overview — top 5 per dish type
│   │   └── [city]/[dishType]/page.tsx  # Full leaderboard (25 entries) + FAQ + JSON-LD
│   │
│   └── api/
│       ├── og/route.tsx           # Dynamic OG image generation (Edge runtime)
│       └── revalidate/route.ts    # On-demand ISR webhook (POST, bearer token)
│
├── proxy.ts                   # Protects /admin/* (auth + admin role check)
│
├── components/
│   ├── icons/fork-logo.tsx        # Web SVG version of the fork logo
│   ├── auth/login-form.tsx        # Client-side login form
│   ├── admin/                     # Admin dashboard components
│   │   ├── admin-sidebar.tsx      # Dark sidebar with ForkLogo + nav links
│   │   ├── admin-nav-links.tsx    # usePathname() for active nav highlighting
│   │   ├── admin-header.tsx       # Top bar with user info
│   │   ├── admin-logout-button.tsx # Sign out + redirect
│   │   ├── metric-card.tsx        # Title + large value metric display
│   │   ├── confirm-dialog.tsx     # Reusable confirmation modal
│   │   ├── blog/                  # Blog editor components
│   │   │   ├── blog-post-editor.tsx    # Main editor form: title, slug, content, metadata
│   │   │   ├── tiptap-editor.tsx       # TipTap editor with StarterKit + extensions
│   │   │   ├── editor-toolbar.tsx      # Formatting buttons
│   │   │   ├── image-upload.tsx        # Drag-drop upload to blog-images bucket
│   │   │   └── blog-post-list-table.tsx # Table rows with status badges
│   │   ├── users/                 # User management components
│   │   │   ├── user-list-table.tsx      # User rows with avatar, stats, badges
│   │   │   ├── user-moderation-panel.tsx # Ban/unban/warn/role-change actions
│   │   │   └── user-activity-tabs.tsx   # Tabs: Ratings, Mod History
│   │   ├── moderation/            # Content moderation components
│   │   │   ├── flag-list.tsx            # Flag rows with resolve/dismiss
│   │   │   ├── photo-review-card.tsx    # Photo card display
│   │   │   └── restaurant-actions.tsx   # Verify/close actions
│   │   └── analytics/             # Analytics chart components
│   │       ├── activity-chart.tsx       # Line chart: users/ratings/battles over time
│   │       ├── city-breakdown-chart.tsx  # Bar chart: per-city metrics
│   │       ├── dish-type-breakdown-chart.tsx # Bar chart: per-dish-type metrics
│   │       ├── leaderboard-health.tsx   # Confidence score distribution
│   │       └── date-range-selector.tsx  # Preset date range buttons
│   ├── layout/
│   │   ├── navbar.tsx             # Fixed top nav (dark bg, gold logo, accent CTA)
│   │   └── footer.tsx             # 4-column footer (brand, explore, legal, download)
│   ├── marketing/                 # Landing page section components
│   ├── leaderboard/               # Leaderboard display components
│   └── ui/                        # Shared UI primitives (Button, Card, Badge, etc.)
│
├── lib/
│   ├── seo.ts                     # buildMetadata(), JSON-LD helpers
│   ├── admin/                     # Admin-specific logic
│   │   ├── auth.ts                # getAdminUser(), requireAdmin() helpers
│   │   ├── queries.ts             # Dashboard stats, recent activity
│   │   ├── blog-queries.ts        # Blog CRUD query helpers
│   │   ├── user-queries.ts        # User list/detail/activity queries
│   │   ├── moderation-queries.ts  # Flag/photo/restaurant queries
│   │   └── analytics-queries.ts   # RPC call wrappers for charts
│   ├── supabase/
│   │   ├── client.ts              # createBrowserClient (for client components)
│   │   ├── server.ts              # createServerClient (reads cookies from next/headers)
│   │   ├── middleware.ts          # createServerClient for middleware (request/response cookies)
│   │   └── static.ts             # createStaticClient (no cookies — for generateStaticParams)
│   └── theme/
│       └── tokens.ts              # TypeScript reference of all design tokens
│
└── types/
    └── database.types.ts          # Supabase auto-generated types (Tables, Functions, etc.)
```

## Git Workflow Rules

**These rules are mandatory — follow them exactly.**

### Branch Strategy

- `main` = **production**. Only receives merges from `development`.
- `development` = **integration**. Feature branches merge here when complete.
- Each priority phase (P0–P9) **must** be developed on its own branch.
- Branch naming: `p<N>/<short-kebab-description>` (e.g., `p2/blog-system`).
- Create branches from `development`: `git checkout -b p<N>/<description> development`.
- When complete and verified, merge into `development` with `--no-ff` and push.
- **Never** commit work directly to `development` or `main`.

### Commit Strategy

- Each **task** (a logical unit of work) **must** be its own commit.
- Commit message format: `P<N>: <imperative summary>` (e.g., `P2: Create blog_posts migration`).
- If multiple closely-related tasks must be combined, list each in the commit body:

  ```
  P2: Set up blog database schema

  - Created blog_posts table with RLS policies
  - Created blog_categories table
  - Created blog_authors table
  ```

- Every commit **must** leave the project in a buildable state (`npm run build` should pass).
- Do not bundle unrelated changes into one commit.

### Merge & Cleanup

- After merging a feature branch to `development`, push `development` to origin.
- PRs from `development` → `main` are done for production releases.
- Do **not** delete remote branches (keep them for history).

## Design System

### Token Source

Design tokens come from the mobile app's `forked/lib/theme/token.default.ts`. They are defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`.

### Key Colors

- **Accent:** `#ee6c2b` (orange)
- **Dark backgrounds:** `#221610` (bg), `#342219` (surface), `#3d2a1f` (surface2)
- **Light backgrounds:** `#f8f6f6` (bg), `#ffffff` (surface), `#F3F4F6` (surface2)
- **Gold:** `#FBBF24` (used for logo, medals)
- **Text (dark mode):** `#ECEDEE` (primary), `#c9a492` (secondary), `#9BA1A6` (tertiary)
- **Text (light mode):** `#221610` (primary), `#4B5563` (secondary), `#687076` (tertiary)

### Dark Mode

Dark mode uses the `.dark` CSS class strategy. The Navbar, Footer, Hero, Mission, and CTA sections use dark styling directly (hard-coded dark tokens), since the landing page alternates between light and dark sections by design.

### Using Tokens

Always use Tailwind utility classes that reference token colors:

```tsx
// Correct
<div className="bg-surface text-text-primary border-border" />
<button className="bg-accent text-accent-on" />

// Incorrect — don't use raw hex values
<div className="bg-[#342219] text-[#ECEDEE]" />
```

Exception: hard-coded hex values are acceptable in dark-only sections (Navbar, Footer, Hero, Mission, CTA) where the background is always dark regardless of theme.

## Supabase Integration

### Three Clients

1. **Server client** (`lib/supabase/server.ts`) — for server components and route handlers. Uses `cookies()` from `next/headers`.
2. **Browser client** (`lib/supabase/client.ts`) — for client components. Cookie-based via `@supabase/ssr`.
3. **Static client** (`lib/supabase/static.ts`) — for `generateStaticParams` and other build-time contexts. Does NOT use cookies. Returns `null` if env vars aren't configured.

### Key RPC Functions

- `get_leaderboard(p_city_id, p_dish_type_id, p_limit, p_min_battles, p_min_ratings, p_neighborhood_id)` — returns ranked entries with elo, win_rate, confidence, etc.
- `get_leaderboard_with_tiebreakers(p_city_id, p_dish_type_id, p_limit)` — same but with stricter tiebreaker ordering.

### Data Fetching Pattern

Leaderboard and stats data is fetched in **server components** using the server Supabase client. No React Query needed for these — server components call Supabase directly.

```tsx
// Server component pattern
export default async function MyPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", { ... });
  return <LeaderboardTable entries={data ?? []} />;
}
```

### Database Slugs

City and dish type pages use slugs from the database for URL routing:

- **Cities:** `new-orleans-louisiana`, `washington-district-of-columbia`
- **Dish types:** `gumbo`, `po-boy`, `crawfish-touff-e`, `muffuletta`, `jambalaya`

## SEO

### Structured Data (JSON-LD)

| Page                             | Schema                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| Root layout                      | `WebSite` + `Organization`                                     |
| `/leaderboard/[city]/[dishType]` | `ItemList` (with `Restaurant` + `AggregateRating`) + `FAQPage` |

### Metadata

Use `buildMetadata()` from `lib/seo.ts` in `generateMetadata` exports. It handles title, description, OG tags, and Twitter cards.

### LLM Optimization

- `llms.txt` at `/llms.txt` describes the site for AI crawlers.
- Dish type leaderboard pages include a direct-answer sentence: "The best [dish] in [city] is at [restaurant]..."
- FAQ sections with `FAQPage` schema on leaderboard pages.

### ISR

All leaderboard and landing pages use `export const revalidate = 600` (10 minutes). On-demand revalidation is available via `POST /api/revalidate` with a bearer token.

## Coding Conventions

- **Prefer server components** — only add `"use client"` when you need browser APIs, state, or effects.
- **Keep components focused** — one component per file, named export matching file name.
- **Use design tokens** — never hard-code colors except in dark-only sections.
- **No star symbols** — Forked does NOT use star ratings. Never use ★ or the word "star" for ratings. Use `ScoreBadge` for score display.
- **Error handling** — Supabase calls should use try/catch and return empty arrays/fallback data on failure. Pages should never crash due to a Supabase error.
- **Import aliases** — use `@/` (maps to `./src/`).
- **File naming** — kebab-case for all files and directories.

## Phase Status

See [PLAN.md](./PLAN.md) for the full implementation roadmap.

- **Phase 1:** Foundation + Landing + Leaderboards → **COMPLETE**
- **Phase 2:** Blog System → **COMPLETE**
- **Phase 3:** Admin Dashboard → **COMPLETE**
- **Phase 4:** Supporting Content → NOT STARTED
- **Phase 5:** Performance & Polish → NOT STARTED
