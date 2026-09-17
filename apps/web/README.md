# Forked Web

The web companion for **Forked** — an Elo-based dish rating and ranking platform.

## What is Forked?

Forked flips food discovery on its head. Instead of rating restaurants with meaningless star ratings, Forked rates **individual dishes** using an Elo system — the same algorithm that ranks chess players. Users eat, snap a mandatory photo, and compare dishes in head-to-head "This vs That" battles. Winners gain points, losers drop. The result: leaderboards that reflect what real people actually prefer.

**The mantra:**
> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

**Core loop:** EAT → SNAP → COMPARE → RANK

## What This Repository Is

This is the **web presence** for Forked. The mobile app (Expo/React Native) lives in a [separate repository](https://github.com/avinash797/forked). Both share the same Supabase backend.

The web app serves several purposes:

- **Marketing landing page** — for ad campaigns, app store optimization, and first impressions
- **Public leaderboards** — SEO-indexed, shareable pages like "Best Gumbo in New Orleans"
- **LLM discoverability** — structured data and `llms.txt` so AI assistants can surface Forked rankings
- **Blog & admin dashboard** — (Phase 2) content marketing and moderation tools

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Backend | Supabase (shared with mobile app) |
| Auth (web) | `@supabase/ssr` (cookie-based) |
| Data fetching | `@tanstack/react-query` |
| SEO | `next-sitemap`, JSON-LD (`schema-dts`), dynamic OG images |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (shared with the Forked mobile app)

### Setup

```bash
# Clone the repository
git clone https://github.com/avinash797/forked-web.git
cd forked-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (also generates sitemap via `postbuild`) |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
forked-web/
├── public/
│   ├── images/fork-logo/           # Logo PNGs (gold, black, white, green, red)
│   ├── robots.txt                  # Crawler rules
│   └── llms.txt                    # AI crawler description file
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, metadata, JSON-LD)
│   │   ├── page.tsx                # Landing page (one-page composition, 8 marketing sections)
│   │   ├── globals.css             # Design tokens + Tailwind theme
│   │   ├── (content)/              # blog, privacy, terms (shared nav/footer layout)
│   │   ├── leaderboard/            # Public leaderboard pages (ISR)
│   │   │   ├── page.tsx            # Hub — city list
│   │   │   ├── [city]/page.tsx     # City overview — all dish types
│   │   │   └── [city]/[dishType]/  # Full ranked leaderboard + FAQ + JSON-LD
│   │   └── api/
│   │       ├── og/                 # Dynamic Open Graph image generation (Edge)
│   │       └── revalidate/         # On-demand ISR webhook
│   │
│   ├── components/
│   │   ├── icons/                  # ForkLogo (web SVG)
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── marketing/              # Hero, TheEnemy, ThreePillars, CityLeaderboardViewer,
│   │   │                           # AntiSlopComparison, SubredditReceipts, FaqSection, CtaSection
│   │   ├── leaderboard/            # LeaderboardTable, DishTypeTabs
│   │   └── ui/                     # Button, Card, Badge, ScoreBadge, Skeleton
│   │
│   ├── lib/
│   │   ├── seo.ts                  # JSON-LD builders + generateMetadata helpers
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client (cookie-based, @supabase/ssr)
│   │   │   ├── server.ts           # Server client (reads next/headers cookies)
│   │   │   └── static.ts           # Build-time client (no cookies, for generateStaticParams)
│   │   └── theme/tokens.ts         # Design tokens adapted from mobile app
│   │
│   └── types/
│       └── database.types.ts       # Supabase generated types (shared with mobile)
│
├── next.config.ts
├── next-sitemap.config.js
├── CLAUDE.md                       # AI assistant coding instructions
└── PLAN.md                         # Implementation roadmap and progress tracker
```

## Shared Resources with Mobile App

This web app and the Forked mobile app share:

- **Supabase backend** — same database, RPC functions, and storage buckets
- **Design tokens** — colors, spacing, and radii adapted from `forked/lib/theme/token.default.ts`
- **Database types** — `database.types.ts` generated from the same Supabase project
- **Fork logo** — SVG paths adapted from `forked/components/fork-logo.tsx`

## Active Cities & Dish Types

**Cities:** New Orleans (Louisiana), Washington (D.C.)

**Dish Types (NOLA launch):** Gumbo, Po'boy, Crawfish Etouffee, Muffuletta, Jambalaya

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | Production site URL (for sitemap/OG images) |
| `REVALIDATION_TOKEN` | Secret token for the ISR revalidation webhook |

## Git Workflow

- **`main`** — production; only receives merges from `development`
- **`development`** — integration branch; feature branches merge here
- **`p<N>/<description>`** — feature branches per priority phase

See [CLAUDE.md](./CLAUDE.md) for the complete git rules and commit conventions.

## License

Private repository. All rights reserved.
