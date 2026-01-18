# Forked v0.1 - Progress Tracker

**Last Updated:** 2026-01-17

This document tracks completion metrics for the **MVP v0.1 Pivot**.

---

## The Pivot

On 2026-01-17, we pivoted from the original roadmap to a focused **MVP v0.1** with:

- **Elo-based "This vs That"** comparisons (not simple ratings)
- **Photo MANDATORY** for all submissions
- **5 dish types only** at launch (NOLA focus)
- **City + Neighborhood leaderboards**
- **Ruthless simplicity** - if it doesn't serve the core loop, cut it

**Core Loop:** `EAT -> SNAP -> COMPARE -> RANK`

---

## Overall Progress

### Project Completion: 35%

```
Backend (Database/RPC)   ████████████████████ 100%
Data Layer (Hooks)       ████░░░░░░░░░░░░░░░░  20%
Core Screens (5 total)   ██░░░░░░░░░░░░░░░░░░  10%
Components               ████░░░░░░░░░░░░░░░░  20%
Rating Flow Updates      ░░░░░░░░░░░░░░░░░░░░   0%
─────────────────────────────────────────────
Overall Progress         ███████░░░░░░░░░░░░░  35%
```

---

## Phase Progress

### Backend (Database & RPC) - 100% Complete

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | Complete | cities, neighborhoods, dish_types, restaurants, profiles, personal_ratings, comparisons, global_dish_scores, taste_tags |
| RPC Functions | Complete | create_rating, process_comparison, get_leaderboard, get_nearby_leaderboard, get_my_best_ever, get_my_dish_rankings, get_pending_comparisons, get_user_stats |
| Seed Data | Complete | New Orleans + 10 neighborhoods + 5 dish types + 15 taste tags |
| RLS Policies | Complete | Row-level security configured |
| Triggers | Complete | Auto-update timestamps, handle_new_user |

**Migrations Applied:**
- `20260117230624_v-0-1-0-init.sql`
- `20260117231311_initial-rpc-functions.sql`
- `20260117231502_initial-rls.sql`
- `20260117231558_initial-triggers.sql`
- `20260117231649_initial-storage-setup.sql`
- `20260117231824_initial-seed-data.sql`
- `20260118001220_update-handle_new_user.sql`
- `20260118001221_update-handle_new_user_fix.sql`
- `20260118004617_additional-missing-rpc-functions.sql`

---

### Data Layer (Hooks) - 20% Complete

| Hook | Status | Notes |
|------|--------|-------|
| `useDishTypes` | Complete | Fetches active dish types |
| `useLeaderboard` | Complete | Calls get_leaderboard_with_tiebreakers RPC |
| `useTopDish` | Complete | Gets #1 dish for a type |
| `useLocationStore` | Partial | Needs DB integration for cities/neighborhoods |
| `use-restaurants.ts` | Not Started | Restaurant search/create |
| `use-ratings.ts` | Not Started | Create rating via RPC |
| `use-comparisons.ts` | Not Started | This vs That battles |
| `use-user-stats.ts` | Not Started | Profile stats and best-ever |

---

### Core Screens - 10% Complete

| Screen | Status | Notes |
|--------|--------|-------|
| Home | Partial | Structure exists, needs hero card and dish pills |
| Leaderboard | Partial | Exists but needs neighborhood toggle |
| Dish Detail | Not Started | New screen for v0.1 |
| This vs That | Not Started | The Elo battle screen |
| Profile | Partial | Exists but needs best-ever cards and stats |

---

### Components - 20% Complete

| Component | Status | Notes |
|-----------|--------|-------|
| Themed Components | Complete | ThemedText, ThemedView, ThemedButton, etc. |
| LocationHeader | Complete | Location display with search |
| LocationBottomSheet | Complete | City/neighborhood picker |
| ScoreBadge | Complete | Can adapt for confidence |
| PhotoPicker | Complete | Photo capture for ratings |
| HeroCard | Not Started | Top dish display |
| DishTypePills | Not Started | Horizontal selector |
| ConfidenceMeter | Not Started | Fire emoji visualization |
| ComparisonCard | Not Started | This vs That split view |
| TasteTagChips | Not Started | Selectable tags |
| BestEverCard | Not Started | Personal best with share |

---

### Rating Flow - 0% Complete

| Task | Status | Notes |
|------|--------|-------|
| Use restaurants instead of venues | Not Started | Schema change |
| Use dish_types instead of custom dishes | Not Started | Schema change |
| Call create_rating RPC | Not Started | New flow |
| Mandatory photo enforcement | Not Started | Must have photo |
| Handle comparison trigger | Not Started | Navigate to This vs That |
| Taste tags selection | Not Started | Optional quick tags |

---

## Progress History

### 2026-01-17 - MVP v0.1 Pivot

- **Major Decision:** Pivoted from original roadmap to focused v0.1
- **Database:** Complete new schema with Elo system
- **Seed Data:** New Orleans + neighborhoods + dish types + taste tags
- **RPC Functions:** All core functions implemented
- **Overall:** 35% complete (backend ready, frontend needs work)

### Previous Progress (Pre-Pivot)

The following was completed before the pivot and can be leveraged:

- Authentication system (signup, login, password reset)
- UI component library (themed components)
- React Query integration
- Photo upload system
- GPS/location services
- Basic profile system

---

## Key Metrics

### Code Statistics

- **Database Tables:** 10 tables (all with RLS)
- **RPC Functions:** 15+ functions
- **Migration Files:** 9 migrations for v0.1
- **Seed Data:** 1 city, 10 neighborhoods, 5 dish types, 15 taste tags

### Target Metrics (30 Days Post-Launch)

| Metric | Target | Current |
|--------|--------|---------|
| Dishes rated | 500+ | 0 |
| Comparisons logged | 2,000+ | 0 |
| App downloads | 1,500+ | 0 |
| DAU | 200+ | 0 |
| Leaderboard confidence | Top 3 have 50+ battles | 0 |

---

## What Was Cut (Kill List)

Features from the original roadmap that are NOT in v0.1:

- Social feed
- Following users
- Comments/long reviews
- Restaurant discovery
- AI taste profiles
- Bookmarks/lists
- Reservations/menus
- Owner portals
- Global leaderboards
- Helpful votes
- Review sorting
- Price tracking
- Gamification UI

---

## Next Steps

1. **Data Layer:** Create missing hooks (restaurants, ratings, comparisons, user-stats)
2. **Home Screen:** Build hero card and dish type pills
3. **This vs That:** Build the Elo battle screen
4. **Rating Flow:** Update to use new schema
5. **Profile:** Add best-ever cards and stats

---

## Update Schedule

- **Daily** during active v0.1 development
- Update after completing each phase
- Update when milestones are reached

---

**Last Review:** 2026-01-17
**Next Review:** Daily during active development
