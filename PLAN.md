# Forked Web — Implementation Plan

## Status Legend

- [x] Complete
- [ ] Not started
- [~] In progress

---

## Phase 1: Foundation + Landing Page + Leaderboards (COMPLETE)

**Branch:** `p1/foundation-and-landing` → merged to `development`

### Step 1: Scaffold Next.js Project [x]

- [x] `create-next-app` with TypeScript, Tailwind v4, App Router, src directory
- [x] Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `next-sitemap`, `schema-dts`
- [x] Configure `next.config.ts` with Supabase image remote patterns
- [x] Create `.env.example` and `.env.local`
- [x] Set up git branch strategy (`main` → `development` → `p1/foundation-and-landing`)
- [x] Create `CLAUDE.md`

### Step 2: Design System [x]

- [x] Create `globals.css` with CSS custom properties from `token.default.ts` (light + dark mode)
- [x] Map all tokens to Tailwind via `@theme inline`
- [x] Create `src/lib/theme/tokens.ts` TypeScript reference

### Step 3: Supabase Integration [x]

- [x] Browser client (`src/lib/supabase/client.ts`) — cookie-based via `@supabase/ssr`
- [x] Server client (`src/lib/supabase/server.ts`) — reads `next/headers` cookies
- [x] Static client (`src/lib/supabase/static.ts`) — for `generateStaticParams` (no cookies)
- [x] Copy `database.types.ts` from Supabase generated types

### Step 4: Shared UI Components [x]

- [x] `ForkLogo` — web SVG adaptation of `forked/components/fork-logo.tsx`
- [x] `Button` — primary, secondary, ghost variants; sm/md/lg sizes
- [x] `Card` — surface, surface2, dark variants
- [x] `Badge` — default, accent, gold, silver, bronze variants
- [x] `ScoreBadge` — color-coded score display (green/yellow/red gradient)
- [x] `Skeleton` — animated loading placeholder
- [x] `Navbar` — fixed top nav with logo, links, CTA
- [x] `Footer` — 4-column layout with links, app store buttons, tagline

### Step 5: Landing Page [x]

- [x] **Hero** — animated dish type rotation, CTAs, app store badges, dark gradient bg
- [x] **Problem** — three problem cards (Google reviews, critics, hidden gems)
- [x] **How It Works** — 4-step flow (Eat, Snap, Compare, Rank)
- [x] **Leaderboard Preview** — live top-5 gumbo data from Supabase via server component
- [x] **Mission** — large typography statements on dark background
- [x] **Stats** — live counters from Supabase aggregate queries
- [x] **Download CTA** — app store badges with gradient background
- [x] Root layout with `WebSite` + `Organization` JSON-LD
- [x] SEO helpers (`src/lib/seo.ts`) for metadata and JSON-LD builders
- [x] ISR revalidation every 10 minutes

### Step 6: Public Leaderboard Pages [x]

- [x] Hub page (`/leaderboard`) — lists active cities
- [x] City page (`/leaderboard/[city]`) — overview of all dish types with top-5 previews
- [x] Dish type page (`/leaderboard/[city]/[dishType]`) — full ranked leaderboard (25 entries)
- [x] `LeaderboardTable` component with rank badges, photos, ScoreBadge, confidence bars
- [x] `DishTypeTabs` component for dish type filtering
- [x] `generateStaticParams` pre-renders all city x dishType combinations
- [x] `ItemList` JSON-LD with `Restaurant` + `AggregateRating` structured data
- [x] `FAQPage` JSON-LD on dish type pages
- [x] LLM-friendly direct-answer text ("The best gumbo in New Orleans is at...")

### Step 7: SEO Infrastructure [x]

- [x] `next-sitemap.config.js` for auto-generated sitemap
- [x] `robots.txt` — allow all, disallow `/admin/*`, `/auth/*`, `/api/*`
- [x] `llms.txt` — AI crawler description file
- [x] Dynamic OG image generation (`/api/og`) with fork logo and branding
- [x] On-demand ISR webhook (`/api/revalidate`) with bearer token auth
- [x] Fork logo PNGs copied to `public/images/fork-logo/`

### Step 8: Marketing Pages [x]

- [x] `(marketing)` route group with shared Navbar + Footer layout
- [x] About page — product description
- [x] How It Works page — 4-step explanation
- [x] Cleaned up default scaffold files

---

## Phase 2: Blog System (COMPLETE)

**Branch:** `p2/blog-system` → merged to `development`

### Database Migration

- [x] Create `blog_posts` table (title, slug, JSONB content, excerpt, published_at, author_id, category_id, featured_image, seo_title, seo_description, status)
- [x] Create `blog_categories` table (name, slug, description, display_order)
- [x] Create `blog_authors` table (name, slug, bio, avatar, social handles)
- [x] Create `blog_tags` + `blog_post_tags` junction table
- [x] RLS policies for public read (published-only for posts)
- [x] Seed data: 1 author, 3 categories, 3 tags, 2 published posts

### Blog Pages

- [x] Blog listing page (`/blog`) with pagination and category filtering
- [x] Blog post page (`/blog/[slug]`) with `Article` JSON-LD
- [x] Category filtering via `BlogCategoryFilter` client component
- [x] "Best X in Y" posts auto-enriched with live leaderboard data via `BlogLeaderboardEnrichment`
- [x] `generateStaticParams` for all published post slugs
- [x] ISR revalidation (10 minutes)
- [x] TipTap JSONB renderer (headings, paragraphs, lists, blockquotes, code, images, marks)

### Blog SEO

- [x] `BlogPosting` JSON-LD on blog post pages
- [x] `ItemList` JSON-LD on blog listing page
- [x] Internal linking between leaderboard pages and blog posts (Related Articles)
- [x] Open Graph images per blog post via existing `/api/og?title=...`
- [x] Blog added to navbar, footer, and `llms.txt`

---

## Phase 3: Admin Dashboard (COMPLETE)

**Branch:** `p3/admin-dashboard` → merged to `development`

### Auth

- [x] Admin login page (`/auth/login`)
- [x] Auth callback route (`/auth/callback`)
- [x] Middleware for protected `/admin/*` routes
- [x] Add `role` column to `profiles` table with `is_admin()` SQL function
- [x] Admin RLS policies for blog tables and storage bucket

### Admin Layout

- [x] Admin sidebar navigation with active state highlighting
- [x] Dashboard overview page (`/admin`) with metric cards and recent activity

### Blog Editor

- [x] Rich text editor for blog posts (`/admin/blog`) using TipTap
- [x] Blog post CRUD (create, edit, publish, unpublish, delete)
- [x] Image upload to Supabase Storage (`blog-images` bucket)
- [x] Draft/publish workflow with SEO fields

### User Management

- [x] User list with search and filters (`/admin/users`)
- [x] User detail view with activity history
- [x] Moderation actions (ban, unban, warn, role change) with audit logging

### Moderation Queue

- [x] Flagged content review (`/admin/moderation`) with resolve/dismiss
- [x] Photo review grid (`/admin/moderation/photos`)
- [x] Restaurant management tools (`/admin/moderation/restaurants`) with verify/close

### Analytics

- [x] Dashboard with key metrics (ratings, battles, users, cities)
- [x] Activity line chart with date range selector (7d/14d/30d/90d)
- [x] City and dish type breakdown bar charts
- [x] Leaderboard health confidence distribution

---

## Phase 4: Supporting Content (NOT STARTED)

**Branch:** `p4/supporting-content` (create from `development`)

- [x] Expanded About page with team, story, investors section
- [x] Expanded How It Works with visual diagrams and animations
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] QR code generation for direct mobile download

---

## Phase 5: Performance & Polish (COMPLETE)

**Branch:** `p5/performance-polish` → merged to `development`

- [x] Error boundary components (global, app, marketing, leaderboard, admin)
- [x] 404 custom page (branded with fork logo)
- [x] 500 custom error page (global-error with inline styles)
- [x] Loading states for all async components (10 loading.tsx skeletons)
- [x] Image optimization audit (removed unoptimized flags, added sizes attributes)
- [x] Core Web Vitals optimization (LCP h1 animation fix, CLS navbar min-height, theme-color)
- [x] Analytics integration (Vercel Analytics + Speed Insights)
- [x] Mobile responsive audit — added hamburger mobile nav menu
- [x] Lighthouse audit — contrast fixes in footer and CTA section

---

## Key Reference Files (Mobile App)

These files in `../forked/` inform the web app's implementation:

| File                                                           | Purpose                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| `lib/theme/token.default.ts`                                   | All design tokens (colors, spacing, radius, typography) |
| `types/database.types.ts`                                      | Auto-generated Supabase types                           |
| `components/fork-logo.tsx`                                     | SVG paths for fork logo                                 |
| `hooks/use-leaderboard.ts`                                     | Leaderboard data fetching pattern via RPC               |
| `lib/supabase.ts`                                              | Supabase client config reference                        |
| `supabase/migrations/20260117230624_v-0-1-0-init.sql`          | Full database schema                                    |
| `supabase/migrations/20260117231311_initial-rpc-functions.sql` | RPC functions                                           |
| `docs/forked_v0.1_spec.md`                                     | Product philosophy, mantra, core loop                   |

---

## Database Context

**Supabase Project:** Forked (`bqxhinoabxmpsvzntrlq`)

**Key RPC functions used by web:**

- `get_leaderboard(p_city_id, p_dish_type_id, p_limit, p_min_battles, p_min_ratings, p_neighborhood_id)`
- `get_leaderboard_with_tiebreakers(p_city_id, p_dish_type_id, p_limit)`

**Key tables queried directly:**

- `cities` (slug, name, state, is_active)
- `dish_types` (slug, name, emoji, is_active, launch_order)
- `personal_ratings` (count for stats)
- `comparisons` (count for stats)

**City slugs in DB:** `new-orleans-louisiana`, `washington-district-of-columbia`

**Dish type slugs in DB:** `gumbo`, `po-boy`, `crawfish-touff-e`, `muffuletta`, `jambalaya`
