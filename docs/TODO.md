# Forked v0.1 - Active TODO List

**Last Updated:** 2026-02-17

This file tracks active work items for the **MVP v0.1 Pivot**. For the full specification, see `forked_v0.1_spec.md`.

---

## The Pivot: What Changed

We've pivoted from the original roadmap to a focused **MVP v0.1** targeting New Orleans with:

| Original Approach       | New v0.1 Approach                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------- |
| 0-10 rating slider      | **Hybrid Elo-based "This vs That" combined with 0-10 rating slider**                |
| Photo encouraged        | **Photo MANDATORY**                                                                 |
| Any dish type           | **5 dish types only** (Gumbo, Po'boy, Fried Chicken, Muffuletta, Crawfish Etouffee) |
| City-level leaderboards | **City + Neighborhood leaderboards**                                                |
| Complex features        | **Ruthless simplicity**                                                             |

**Core Loop:** `EAT -> SNAP -> COMPARE -> RANK`

**The Mantra:** _"In under 30 seconds, tell me the best specific dish near me that people like me actually love."_

---

## Database & Backend Status

### Complete

- [x] New database schema (v0.1 init + rating redefine + supporting tables)
    - cities, neighborhoods, dish_types, restaurants, profiles
    - personal_ratings (raw_score NUMERIC(3,1), personal_elo, battle stats)
    - comparisons (battle history with Elo audit trail, skip reasons)
    - global_dish_scores (leaderboard data with credibility-weighted Elo)
    - taste_tags, personal_rating_tags
    - city_known_dishes (city-to-dish-type junction)
    - dish_type_variations (sub-types like Pepperoni/Margherita)
    - leaderboard_snapshots (daily historical ranking data)
    - restaurant_dishes (auto-populated catalog with trigger)

- [x] RPC Functions
    - `post_rating_and_get_duel` - Combined rating creation + duel matching (returns JSON)
    - `submit_comparison` - Handle duels from rating flow (ELO delta calculation)
    - `process_comparison` - Handle standalone This vs That battles
    - `find_comparison_candidate` - Match opponents within ±400 Elo
    - `update_global_dish_score` - Aggregate credibility-weighted scores
    - `calculate_user_credibility` - Logarithmic credibility (1.0 + 0.5 \* ln(count))
    - `find_nearby_restaurants` - PostGIS geolocation search (ST_Distance/ST_DWithin)
    - `get_leaderboard` - City/neighborhood leaderboard with standardized tie-breaking
    - `search_restaurants` / `search_dish_types` / `search_restaurant_dishes` - Fuzzy cross-search using pg_trgm
    - `get_my_best_ever` - User's top dish per type
    - `get_my_dish_rankings` - User's rankings for a dish type
    - `get_pending_comparisons` - Find pairs to compare
    - `get_user_stats` - User profile statistics

- [x] Seed Data
    - New Orleans city (active)
    - 10 NOLA neighborhoods
    - 5 launch dish types with emojis and aliases
    - 15 taste tags

- [x] RLS Policies, Triggers, and PostGIS Integration

---

## Current Sprint: Final Polish & Testing

### Remaining Screen Work

#### Home Screen

- [ ] "Show #2 and #3" expandable
- [ ] Get Directions CTA

#### Dish Detail

- [ ] Ranking badge: "#X [Dish] in [Location]"
- [ ] Map snippet with directions CTA
- [ ] "Compare This Dish" button

### Remaining Components

- [ ] **RankBadge** - "#X in [Location]" badge

### Testing & Polish

- [ ] End-to-end test: full rating flow (photo -> venue -> dish -> rate -> duel)
- [ ] End-to-end test: standalone This vs That from pending comparisons
- [ ] End-to-end test: venue search (Google Places + local DB hybrid)
- [ ] Error handling audit across all screens
- [ ] Loading state consistency check
- [ ] Verify GPS verification flow on device

---

## Completed Work

### Phase 1: Data Layer (Hooks) - 100% Complete

- [x] `useLocationStore` - DB integration for cities/neighborhoods + currentLocation
- [x] `use-restaurants.ts` - useSearchRestaurants, useNearbyRestaurants (PostGIS), useCreateRestaurant
- [x] `use-ratings.ts` - useCreateRating (post_rating_and_get_duel), useUpdateRating, useMyDishRankings, useMyRatings, useCheckRateLimit, useTasteTags, usePersonalRating
- [x] `use-comparisons.ts` - usePendingComparisons, useSubmitComparison, useProcessComparison, useCheckSkipRate, useComparisonHistory
- [x] `use-user-stats.ts` - useUserStats, useMyBestEver, useUserBadges
- [x] `use-address-search.ts` - Google Places Autocomplete with proximity bias, address parsing
- [x] `use-debounce.ts` - Generic debounce utility hook

### Phase 2: Core Screens - 85% Complete

- [x] **Home** - Hero card, dish pills, location badge, FAB
- [x] **Leaderboard** - City/Near Me/Neighborhood toggle, ranked list 1-10
- [x] **Dish Detail** - Hero photo, restaurant info, confidence meter, taste tags
- [x] **This vs That** - Full duel flow: animated cards, gradient overlays, VS badge, skip with reasons, dual mode (from rating flow + standalone)
- [x] **Profile** - Avatar, home city, stats row, Best Ever cards, badges
- [x] **Venue Search** - Hybrid Google Places + local DB, nearby preload, auto-create from Google
- [x] **Rating** - 0-10 numeric input, photo upload, taste tags, GPS verification, duel trigger

### Phase 3: Rating Flow - 100% Complete

- [x] Use `restaurants` instead of `venues`
- [x] Use `dish_types` instead of custom dishes
- [x] Call `post_rating_and_get_duel` RPC (combined rating + duel matching)
- [x] Photo is MANDATORY (no submission without photo)
- [x] Raw score 0-10 input (NUMERIC scale)
- [x] Optional taste tags selection
- [x] Handle comparison trigger after rating (navigate to This vs That if duel found)
- [x] GPS verification with distance calculation

### Phase 4: Components - 90% Complete

- [x] HeroCard, DishTypePills, ConfidenceMeter
- [x] ComparisonCard (animated split view with gradient overlays)
- [x] TasteTagChips (selectable tag chips)
- [x] BestEverCard, BestEverSection, StatsRow, BadgesSection
- [x] LeaderboardRow
- [x] All themed components (ThemedText, ThemedView, ThemedButton, etc.)

### Venue Search & Creation - 100% Complete

- [x] Google Places Autocomplete (proximity-biased, food/restaurant types)
- [x] Local DB restaurant search (ilike + nearby PostGIS query)
- [x] Hybrid search results (DB restaurants + Google Places suggestions). Now with fuzzy cross-search.
- [x] Auto-create restaurant from Google Place details
- [x] Nearby restaurant preloading via find_nearby_restaurants RPC
- [x] Fuzzy Cross-Search RPCs for all categories

---

## Environment Variables

Required in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # NEW - required for venue search
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token                 # Optional
EXPO_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_key           # Analytics
```

---

## What's NOT in v0.1 (Kill List)

- [-] ~~Social feed~~
- [-] ~~Following users~~
- [-] ~~Comments/reviews text~~
- [-] ~~Restaurant discovery~~
- [-] ~~AI taste profiles~~ (collecting tags now, AI later)
- [-] ~~Bookmarks/lists~~
- [-] ~~Reservations/menus~~
- [-] ~~Owner portals~~
- [-] ~~Global leaderboards~~
- [-] ~~Helpful votes~~
- [-] ~~Review sorting~~
- [-] ~~Map view on Profile~~ (deferred to post-v0.1)

---

## Success Metrics (30 Days Post-Launch)

| Metric                 | Target                              |
| ---------------------- | ----------------------------------- |
| Dishes rated           | 500+                                |
| Comparisons logged     | 2,000+                              |
| App downloads          | 1,500+                              |
| DAU                    | 200+                                |
| Leaderboard confidence | Top 3 per category have 50+ battles |

---

## Notes

- Database is READY - 14 tables, 20+ RPCs, seed data all in place
- ELO system: Initial Elo = 1000 + (raw_score \* 100), K-factor = 32
- Credibility weighting: Expert users' ratings count more in global scores
- Google Maps API key required for venue search (Places API must be enabled)
- PostGIS required on Supabase for geolocation features
- restaurant_dishes table auto-populates via trigger when ratings are inserted

---

## Task Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked
- `[-]` - Cancelled/Won't do
