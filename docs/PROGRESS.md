# Forked v0.1 - Progress Tracker

**Last Updated:** 2026-02-17

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

### Project Completion: 85%

```
Backend (Database/RPC)   ████████████████████ 100%
Data Layer (Hooks)       ████████████████████ 100%
Core Screens (5 total)   ████████████████░░░░  85%
Components               ██████████████░░░░░░  70%
Rating Flow Updates      ████████████████████ 100%
Venue Search & Creation  ████████████████████ 100%
─────────────────────────────────────────────
Overall Progress         █████████████████░░░  85%
```

---

## Phase Progress

### Backend (Database & RPC) - 100% Complete

| Component           | Status   | Notes                                                                                                                                                                                                      |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database Schema     | Complete | cities, neighborhoods, dish_types, restaurants, profiles, personal_ratings, comparisons, global_dish_scores, taste_tags, city_known_dishes, dish_type_variations, leaderboard_snapshots, restaurant_dishes |
| RPC Functions       | Complete | post_rating_and_get_duel, submit_comparison, find_comparison_candidate, update_global_dish_score, calculate_user_credibility, find_nearby_restaurants, + all v0.1 init RPCs                                |
| Seed Data           | Complete | New Orleans + 10 neighborhoods + 5 dish types + 15 taste tags                                                                                                                                              |
| RLS Policies        | Complete | Row-level security configured                                                                                                                                                                              |
| Triggers            | Complete | Auto-update timestamps, handle_new_user, auto-populate restaurant_dishes                                                                                                                                   |
| PostGIS Geolocation | Complete | find_nearby_restaurants RPC with ST_Distance/ST_DWithin                                                                                                                                                    |

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
- `20260118160233_location-rpc.sql`
- `20260130205859_rating-redefine.sql` - ELO system, personal_ratings, comparisons, global_dish_scores
- `20260130223621_rating-redefine-part-2.sql` - city_known_dishes, dish_type_variations, leaderboard_snapshots, restaurant_dishes
- `20260131000006_fix_raw_score_type_in_rpcs.sql` - Fixed 7 RPCs for NUMERIC raw_score type
- `20260131181759_find_nearby_restaurants_rpc.sql` - PostGIS geolocation search
- `20260216000000_search_rpc_functions.sql` - Cross-search RPC functions using pg_trgm fuzzy matching
- `20260217130500_standardize_leaderboard_functions.sql` - Consolidated leaderboard logic with robust tie-breaking

---

### Data Layer (Hooks) - 100% Complete

| Hook                    | Status   | Notes                                                                                                                                                |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDishTypes`          | Complete | Fetches active dish types                                                                                                                            |
| `useLeaderboard`        | Complete | Calls get_leaderboard_with_tiebreakers RPC                                                                                                           |
| `useLocationStore`      | Complete | DB integration for cities/neighborhoods + currentLocation                                                                                            |
| `use-restaurants.ts`    | Complete | useSearchRestaurants, useNearbyRestaurants (PostGIS), useCreateRestaurant                                                                            |
| `use-ratings.ts`        | Complete | useCreateRating (post_rating_and_get_duel RPC), useUpdateRating, useMyDishRankings, useMyRatings, useCheckRateLimit, useTasteTags, usePersonalRating |
| `use-comparisons.ts`    | Complete | usePendingComparisons, useSubmitComparison, useProcessComparison, useCheckSkipRate, useComparisonHistory                                             |
| `use-user-stats.ts`     | Complete | Profile stats (useUserStats, useMyBestEver, useUserBadges)                                                                                           |
| `use-address-search.ts` | Complete | Google Places Autocomplete with proximity bias, address parsing, 300ms debounce                                                                      |
| `use-debounce.ts`       | Complete | Generic debounce utility hook                                                                                                                        |

---

### Core Screens - 85% Complete

| Screen       | Status          | Notes                                                                               |
| ------------ | --------------- | ----------------------------------------------------------------------------------- |
| Home         | Complete        | Hero card, dish pills, location badge, FAB                                          |
| Leaderboard  | Complete        | City/Near Me/Neighborhood toggle, ranked list                                       |
| Dish Detail  | Mostly Complete | Hero photo, restaurant info, confidence meter, taste tags                           |
| This vs That | Complete        | Full duel flow with voting, skip reasons, animated cards, gradient overlays         |
| Profile      | Complete        | Avatar, home city, stats row, Best Ever cards, badges                               |
| Venue Search | Complete        | Hybrid Google Places + local DB search, nearby restaurants, auto-create from Google |
| Rating       | Complete        | 0-10 numeric input, photo upload, taste tags, GPS verification, duel trigger        |

**Remaining:**

- [ ] Dish Detail: Ranking badge ("#X in [Location]")
- [ ] Dish Detail: Map snippet with directions CTA
- [ ] Home: "Show #2 and #3" expandable
- [ ] Home: Get Directions CTA

---

### Components - 70% Complete

| Component           | Status      | Notes                                      |
| ------------------- | ----------- | ------------------------------------------ |
| Themed Components   | Complete    | ThemedText, ThemedView, ThemedButton, etc. |
| LocationHeader      | Complete    | Location display with search               |
| LocationBottomSheet | Complete    | City/neighborhood picker                   |
| ScoreBadge          | Complete    | Color-coded rating badge                   |
| PhotoPicker         | Complete    | Photo capture for ratings                  |
| BestEverCard        | Complete    | Personal best dish card with share         |
| BestEverSection     | Complete    | Horizontal scrollable Best Ever cards      |
| StatsRow            | Complete    | User stats (dishes/cities/battles)         |
| BadgesSection       | Complete    | Horizontal scrollable badges display       |
| HeroCard            | Complete    | Top dish display for home                  |
| DishTypePills       | Complete    | Horizontal selector                        |
| ConfidenceMeter     | Complete    | Fire emoji visualization                   |
| ComparisonCard      | Complete    | This vs That split view with animations    |
| TasteTagChips       | Complete    | Selectable tags                            |
| RankBadge           | Not Started | "#X in [Location]" badge                   |

---

### Rating Flow - 100% Complete

| Task                                    | Status   | Notes                                                |
| --------------------------------------- | -------- | ---------------------------------------------------- |
| Use restaurants instead of venues       | Complete | Schema + hooks migrated                              |
| Use dish_types instead of custom dishes | Complete | Schema + hooks migrated                              |
| Call post_rating_and_get_duel RPC       | Complete | Integrated into useCreateRating                      |
| Mandatory photo enforcement             | Complete | No submission without photo                          |
| Handle comparison trigger               | Complete | Navigates to This vs That after rating if duel found |
| Taste tags selection                    | Complete | Optional quick tags after rating                     |
| GPS verification                        | Complete | Location captured, distance calculated               |

---

### Venue Search & Creation - 100% Complete

| Task                               | Status   | Notes                                                                                       |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| Google Places Autocomplete         | Complete | Proximity-biased search for food/restaurant types                                           |
| Local DB restaurant search         | Complete | ilike search + nearby PostGIS query                                                         |
| Hybrid search results              | Complete | DB restaurants (solid border) + Google Places (dashed border). Now with fuzzy cross-search. |
| Auto-create restaurant from Google | Complete | Parses address, creates restaurant record                                                   |
| Nearby restaurant preloading       | Complete | GPS-based preload via find_nearby_restaurants RPC                                           |
| Fuzzy Cross-Search RPCs            | Complete | `search_restaurants`, `search_dish_types`, and `search_restaurant_dishes`                   |

---

## Progress History

### 2026-02-17 - Discovery & Standardization Overhaul

- **Search:** Implemented fuzzy cross-search using `pg_trgm`.
    - Search across Dish Types, Restaurants, and specific Restaurant Dishes.
    - Added `useSearch` hook with debouncing and consolidated result handling.
- **Leaderboard:** Standardized `get_leaderboard` logic.
    - Consolidated tie-breaker logic (Elo -> Win Rate -> Battles -> Avg Score -> Created At).
    - Removed redundant `get_leaderboard_with_tiebreakers` RPC.
- **Infrastructure:** Major type cleanup.
    - Removed legacy `types/browse.ts`, `types/rating.ts`, and `types/database.ts`.
    - Regenerated `types/database.types.ts` to match schema.
- **Overall:** 90% complete

### 2026-02-01 - Venue Search & Database Overhaul

- **Venue Search:** Complete Google Places + local DB hybrid search
    - Google Places Autocomplete with proximity bias (5km radius)
    - Filters to food/restaurant/cafe/bar/bakery types
    - Auto-creates restaurant records from Google Place details
    - Nearby restaurants preloaded via PostGIS geolocation RPC
- **Database Schema Expansion:**
    - New tables: city_known_dishes, dish_type_variations, leaderboard_snapshots, restaurant_dishes
    - restaurant_dishes auto-populated via trigger on new ratings
    - restaurants.types text[] array for category labels
    - raw_score type fixed from INTEGER to NUMERIC(3,1) across all RPCs
    - find_nearby_restaurants RPC using PostGIS ST_Distance/ST_DWithin
- **Rating Flow:** Complete with duel integration
    - post_rating_and_get_duel RPC combines rating creation + duel matching
    - Initial Elo: 1000 + (raw_score \* 100)
    - Immediate duel trigger if comparison candidate found
- **This vs That:** Complete duel flow
    - Dual mode: from rating flow (immediate) or standalone (pending comparisons)
    - Animated card slide-in, gradient overlays, VS badge
    - Skip modal with 5 skip reasons for data collection
    - ELO deltas stored for audit trail
- **New Hooks:** use-address-search.ts (Google Places), use-debounce.ts (utility)
- **New Env Var:** EXPO_PUBLIC_GOOGLE_MAPS_API_KEY required for venue search
- **Overall:** 85% complete

### 2026-01-30 - ELO Rating System & Comparisons

- **Database:** Redefined schema with ELO-based personal_ratings, comparisons, global_dish_scores
- **RPC Functions:** post_rating_and_get_duel, submit_comparison, find_comparison_candidate, update_global_dish_score, calculate_user_credibility
- **Hooks:** Comprehensive use-ratings.ts and use-comparisons.ts with React Query
- **Credibility System:** Logarithmic user credibility scoring (1.0 + 0.5 \* ln(review_count))

### 2026-01-20 - Profile Screen Update

- **Profile Screen:** Complete redesign to match v0.1 spec
    - Removed old 3-tab layout (Reviews, Activities, Achievements)
    - Added StatsRow component (dishes/cities/battles)
    - Added BestEverSection with horizontal scrolling cards
    - Added BadgesSection with computed achievement badges
    - Hero section shows avatar, display name, home city
- **New Components:** StatsRow, BestEverSection, BadgesSection
- **Deferred:** Map view toggle moved to post-v0.1
- **Overall:** 70% complete

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

- **Database Tables:** 14 tables (all with RLS)
- **RPC Functions:** 20+ functions
- **Migration Files:** 14 migrations for v0.1
- **Seed Data:** 1 city, 10 neighborhoods, 5 dish types, 15 taste tags
- **Custom Hooks:** 12+ React Query hooks

### Target Metrics (30 Days Post-Launch)

| Metric                 | Target                 | Current |
| ---------------------- | ---------------------- | ------- |
| Dishes rated           | 500+                   | 0       |
| Comparisons logged     | 2,000+                 | 0       |
| App downloads          | 1,500+                 | 0       |
| DAU                    | 200+                   | 0       |
| Leaderboard confidence | Top 3 have 50+ battles | 0       |

---

## What Was Cut (Kill List)

Features from the original roadmap that are NOT in v0.1:

- Social feed
- Following users
- Comments/long reviews
- Restaurant discovery (we discover DISHES)
- AI taste profiles (collecting tags now, AI later)
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

1. **RankBadge Component:** Build "#X in [Location]" badge for dish detail
2. **Dish Detail:** Add ranking badge and map with directions CTA
3. **Home Screen:** Add "Show #2 and #3" expandable and Get Directions CTA
4. **Testing:** End-to-end testing of core loop (EAT -> SNAP -> COMPARE -> RANK)
5. **Polish:** Animations, loading states, error handling across all screens

---

## Update Schedule

- **Daily** during active v0.1 development
- Update after completing each phase
- Update when milestones are reached

---

**Last Review:** 2026-02-01
**Next Review:** Daily during active development
