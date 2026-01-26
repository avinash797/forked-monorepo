# Forked v0.1 - Product Roadmap

**Last Updated:** 2026-01-17

## The Pivot

We've pivoted from the original multi-phase roadmap to a focused **MVP v0.1** targeting New Orleans. This document now reflects the new direction.

For the full specification, see `new-goals/forked_v0.1_spec.md`.

---

## The Mantra

> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

If a feature doesn't serve that, it's out.

---

## What Changed

| Original Approach | New v0.1 Approach |
|-------------------|-------------------|
| 0-10 rating slider | **Elo-based "This vs That" battles** |
| Photo encouraged | **Photo MANDATORY** |
| Any dish type | **5 dish types only** |
| City-level leaderboards | **City + Neighborhood leaderboards** |
| Complex features | **Ruthless simplicity** |

---

## The Core Loop

```
EAT -> SNAP -> COMPARE -> RANK
```

1. **Eat** a dish
2. **Snap** a photo (mandatory)
3. **Compare** it against another dish you've had (This vs That)
4. **Rank** updates automatically via Elo
5. **Benefit** later when deciding what to eat

---

## Current Status: 35% Complete

### Backend (Database & RPC) - 100% Complete

- Database schema with Elo system
- All RPC functions implemented
- Seed data for New Orleans
- RLS policies and triggers

### Frontend - 20% Complete

- Some hooks exist (need updates)
- Some screens exist (need major updates)
- Components partially ready

---

## Launch Dishes (NOLA Only)

**Hard limit: 5 dish types at launch.**

| Dish | Emoji | Why |
|------|-------|-----|
| Gumbo | `#` | The iconic NOLA dish. Fierce local opinions. |
| Po'boy | `#` | High frequency, clear "best" debates |
| Fried Chicken | `#` | Willie Mae's territory. Emotional. |
| Muffuletta | `#` | Central Grocery vs everyone else |
| Crawfish Etouffee | `#` | Seasonal, passionate fanbase |

**Expansion rule:** Add 2 new dish types only after 500+ comparisons in existing categories.

---

## The 5 Screens

### Screen 1: Home - "What Should I Eat Right Now?"

**Purpose:** Kill decision fatigue in 3 seconds.

- Location badge at top
- Dish selector pills (5 types)
- Hero card showing #1 dish for selected type
- Floating camera button (FAB)

**This screen alone should make the app worth keeping.**

### Screen 2: Dish Leaderboard

**Purpose:** Establish authority. Settle arguments.

- Header: "Best [Dish] in New Orleans"
- Toggle: City | Near Me | Neighborhood
- Ranked list 1-10 with confidence meters

### Screen 3: Dish Detail

**Purpose:** Build trust before someone makes a trip.

- Hero photo
- Ranking badge
- Confidence meter
- Taste tags
- Map with directions

### Screen 4: This vs That

**Purpose:** The data engine. Make it feel like a game.

- Full-screen split (Photo A vs Photo B)
- Center prompt: "Which [Dish] wins?"
- Tap to vote
- Optional quick tags after

**This screen should feel like Tinder for food.**

### Screen 5: Profile

**Purpose:** Personal reward. Make users care about contributing.

- Avatar + stats
- "Best Ever" cards per dish type
- Badges and achievements
- Map of what you've eaten

---

## Implementation Phases

### Phase 1: Data Layer (Current Sprint)

- [ ] Update `location.store.ts` for DB cities
- [ ] Create `use-restaurants.ts` hook
- [ ] Create `use-ratings.ts` hook
- [ ] Create `use-comparisons.ts` hook
- [ ] Create `use-user-stats.ts` hook

### Phase 2: Core Screens

- [ ] Build Home screen with hero card
- [ ] Build Leaderboard with neighborhood toggle
- [ ] Build Dish Detail screen
- [ ] Build This vs That screen
- [ ] Update Profile with best-ever cards

### Phase 3: Rating Flow

- [ ] Update to use new schema (restaurants, dish_types)
- [ ] Enforce mandatory photo
- [ ] Handle comparison trigger
- [ ] Add taste tags selection

### Phase 4: Polish & Launch

- [ ] Test all flows
- [ ] Seed initial data with Founding Forks
- [ ] Beta launch to NOLA locals

---

## What's NOT in v0.1

| Feature | Why It's Cut |
|---------|--------------|
| Social feed | Noise, not utility |
| Following users | Not needed for core loop |
| Comments | Toxic + low signal |
| Restaurant discovery | We discover DISHES |
| AI taste profiles | Data first, AI later |
| Bookmarks/lists | Rankings replace lists |
| Reservations/menus | We're not OpenTable |
| Owner portals | We care about eaters, not owners (yet) |
| Global leaderboards | Too abstract early |

---

## Cold-Start Strategy: New Orleans

### Why NOLA First

1. Iconic dishes with fierce local opinions
2. Clear "hole in the wall" culture
3. Tourist destination (built-in discovery use case)
4. Anti-Yelp sentiment among locals
5. Compact geography (easy to seed)

### Phase 1: Dish Seeding (Pre-Launch)

**Goal:** 200+ dishes rated, 500+ comparisons before public launch.

- 10 True Believers ("Founding Fork" badge)
- 15-20 Paid Seeders ($15/dish entry)
- Each seeder hits 10-15 restaurants
- Focus on the 5 launch dishes

### Phase 2: Closed Beta

- QR codes at bars (not restaurants)
- Bartenders and servers
- r/NewOrleans, NOLA Twitter
- Stickers at hole-in-the-wall spots

### Phase 3: Public Launch

- Publish "Top 10 Gumbo in New Orleans"
- Include 1-2 controversial picks
- CTA: "Disagree? Download Forked and vote."

---

## Success Metrics (30 Days Post-Launch)

| Metric | Target |
|--------|--------|
| Dishes rated | 500+ |
| Comparisons logged | 2,000+ |
| App downloads | 1,500+ |
| DAU | 200+ |
| Leaderboard confidence | Top 3 per category have 50+ battles |
| Press mentions | 3+ local |
| Organic shares | 100+ share cards |

---

## Future Roadmap (Post v0.1)

| Version | Key Additions |
|---------|---------------|
| v0.1 | Core loop, 5 dishes, NOLA only |
| v0.2 | Expand to 10 dishes, add Houston/Austin, Founding Fork badges visible |
| v0.3 | AI taste profiles, personalized rankings |
| v0.4 | Social layer (follow experts), "Dish Expert" verification |
| v1.0 | National rollout, restaurant owner dashboards, API |

---

## The Moat

> Your real moat is not AI. Your moat is **dish-level truth + friction that filters liars.**

AI becomes lethal AFTER:
- 100k comparisons
- 10k verified dishes
- Clear taste vectors from tags

---

## Update Schedule

- **Weekly** during active v0.1 development
- Update after completing each phase
- Update when milestones are reached

---

**Last Review:** 2026-01-17
**Next Review:** Weekly during v0.1 development
