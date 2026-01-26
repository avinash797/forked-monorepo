# Forked v0.1 - Active TODO List

**Last Updated:** 2026-01-20

This file tracks active work items for the **MVP v0.1 Pivot**. For the full specification, see `new-goals/forked_v0.1_spec.md`.

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

### Already Complete

- [x] New database schema (`v-0-1-0-init.sql`)
    - cities, neighborhoods, dish_types, restaurants, profiles
    - personal_ratings (with raw_score 1-10, personal_elo)
    - comparisons (battle history with Elo audit trail)
    - global_dish_scores (leaderboard data)
    - taste_tags, personal_rating_tags

- [x] RPC Functions
    - `create_rating` - Main entry point for rating a dish
    - `process_comparison` - Handle This vs That battles
    - `get_leaderboard` / `get_nearby_leaderboard` - City/neighborhood leaderboards
    - `get_my_best_ever` - User's top dish per type
    - `get_my_dish_rankings` - User's rankings for a dish type
    - `get_pending_comparisons` - Find pairs to compare
    - `get_user_stats` - User profile statistics

- [x] Seed Data
    - New Orleans city (active)
    - 10 NOLA neighborhoods
    - 5 launch dish types with emojis and aliases
    - 15 taste tags

- [x] RLS Policies and Triggers

---

## Current Sprint: Core v0.1 Implementation

### Phase 1: Data Layer (Hooks)

- [x] **Update `location.store.ts`**
    - Fetch actual cities from DB (not hardcoded)
    - Match user location to city/neighborhood
    - Store selected neighborhood for filtering

- [x] **Create `use-restaurants.ts` hook**
    - Search restaurants by name
    - Get nearby restaurants with distance
    - Create new restaurant

- [x] **Create `use-ratings.ts` hook**
    - Call `create_rating` RPC
    - Handle comparison trigger response
    - Update personal ratings

- [x] **Create `use-comparisons.ts` hook**
    - Call `process_comparison` RPC
    - Get pending comparisons
    - Track comparison history

- [x] **Create `use-user-stats.ts` hook**
    - Call `get_user_stats` RPC
    - Call `get_my_best_ever` RPC
    - Call `get_my_dish_rankings` RPC

### Phase 2: Core Screens (5 Screens)

#### Screen 1: Home - "What Should I Eat Right Now?"

- [x] Location badge at top (city/neighborhood)
- [x] Dish type selector pills (5 types)
- [x] Hero card showing #1 dish for selected type
    - Restaurant name, neighborhood, distance
    - Confidence meter (fire emojis)
    - Featured photo
- [ ] "Show #2 and #3" expandable
- [ ] Get Directions CTA
- [x] Floating camera button (FAB) bottom right

#### Screen 2: Dish Leaderboard

- [x] Header: "Best [Dish Type] in New Orleans"
- [x] Toggle: `City` | `Near Me (2mi)` | `[Neighborhood]`
- [x] Ranked list 1-10
    - Crown emoji for #1
    - Restaurant name + neighborhood
    - Confidence meter
    - Photo thumbnail
- [x] Tappable rows -> Dish Detail

#### Screen 3: Dish Detail

- [x] Hero photo (full width)
- [x] Dish name + Restaurant name
- [ ] Ranking badge: "#X [Dish] in [Location]"
- [x] Confidence meter (visual)
- [x] Taste tags (crowd-sourced)
- [ ] Map snippet with directions CTA
- [ ] "Compare This Dish" button

#### Screen 4: This vs That (The Elo Engine)

- [x] Full-screen split view
    - Top half: Photo A (new dish or random)
    - Bottom half: Photo B (comparison dish)
- [x] Center prompt: "Which [Dish Type] wins?"
- [x] Tap either photo to vote
- [ ] After vote:
    - Optional quick tag selection (skippable)
    - "Thanks! Rankings updated." -> dismiss
- [ ] Skip option with reason picker

#### Screen 5: Profile - "Your Taste History"

- [x] Avatar + username + home city
- [x] "Best Ever" cards (auto-generated per dish type)
    - Photo + restaurant + date
    - Share button
- [x] Stats row: `X dishes` | `X cities` | `X battles`
- [x] Badges: "Gumbo Authority" etc.
- [-] Map view toggle (pins of what you've eaten) - Deferred to post-v0.1

### Phase 3: Rating Flow Updates

- [x] Update rating flow to use new schema
    - Use `restaurants` instead of `venues`
    - Use `dish_types` instead of custom dishes
    - Call `create_rating` RPC
- [x] Photo is MANDATORY (no submission without photo)
- [x] Raw score 1-10 input
- [x] Optional taste tags selection
- [x] Handle comparison trigger after rating
    - If `should_compare` is true, navigate to This vs That

### Phase 4: Components

- [x] **HeroCard** - Top dish display for home
- [x] **DishTypePills** - Horizontal scrollable selector
- [x] **ConfidenceMeter** - Fire emoji visualization
- [x] **ComparisonCard** - Split screen for This vs That
- [x] **TasteTagChips** - Selectable tag chips
- [x] **BestEverCard** - Personal best dish card with share
- [x] **BestEverSection** - Horizontal scrollable section for profile
- [x] **StatsRow** - User stats display (dishes/cities/battles)
- [x] **BadgesSection** - Horizontal scrollable badges display
- [ ] **RankBadge** - "#X in [Location]" badge
- [x] **LeaderboardRow** - Ranked list item

---

## Existing Code to Leverage

### Can Reuse (with modifications)

- `useDishTypes` hook - Already fetches active dish types
- `useLeaderboard` / `useTopDish` hooks - Already call RPC functions
- `useLocationStore` - Needs DB integration but structure is good
- `usePhotoUpload` hook - Photo upload to Supabase Storage
- Rating flow screens - Need updates for new schema
- Profile screens - Need updates for new stats/best-ever

### Existing Components to Keep

- `ThemedText`, `ThemedView`, `ThemedButton`, etc.
- `ScoreBadge` - Can adapt for confidence display
- `PhotoPicker` - For photo capture
- `LocationHeader`, `LocationBottomSheet`

---

## What's NOT in v0.1 (Kill List)

- [ ] ~~Social feed~~
- [ ] ~~Following users~~
- [ ] ~~Comments/reviews text~~
- [ ] ~~Restaurant discovery~~
- [ ] ~~AI taste profiles~~
- [ ] ~~Bookmarks/lists~~
- [ ] ~~Reservations/menus~~
- [ ] ~~Owner portals~~
- [ ] ~~Global leaderboards~~
- [ ] ~~Helpful votes~~
- [ ] ~~Review sorting~~

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

- Database is READY - schema, RPC functions, seed data all in place
- Focus on the 5 screens - they are the entire MVP
- Keep it simple - if a feature doesn't serve the core loop, cut it
- The "This vs That" screen is the data engine - make it feel like a game

---

## Task Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked
- `[-]` - Cancelled/Won't do
