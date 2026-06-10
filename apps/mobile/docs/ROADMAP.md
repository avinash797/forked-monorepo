# Forked v0.1 - Product Roadmap

**Last Updated:** 2026-02-01

## The Pivot

## We've pivoted from the original multi-phase roadmap to a focused **MVP v0.1** targeting New Orleans. This document now reflects the new direction.

## The Mantra

> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

If a feature doesn't serve that, it's out.

---

## What Changed

| Original Approach       | New v0.1 Approach                                    |
| ----------------------- | ---------------------------------------------------- |
| 0-10 rating slider      | **Hybrid Elo-based "This vs That" + 0-10 raw score** |
| Photo encouraged        | **Photo MANDATORY**                                  |
| Any dish type           | **5 dish types only**                                |
| City-level leaderboards | **City + Neighborhood leaderboards**                 |
| Complex features        | **Ruthless simplicity**                              |

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

## The 5 Screens

### Screen 1: Home - "What Should I Eat Right Now?"

**Purpose:** Kill decision fatigue in 3 seconds.

- Location badge at top
- Hero card showing dish recommendations that the user might like and has not tried yet

**This screen alone should make the app worth keeping.**

### Screen 2: Dish Leaderboard

**Purpose:** Establish authority. Settle arguments.

- Header: "Best [Dish] in New Orleans"
- Toggle: Dish types
- Ranked list 1-n with confidence meters

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

## What's NOT in v0.1

| Feature              | Why It's Cut                           |
| -------------------- | -------------------------------------- |
| Social feed          | Noise, not utility                     |
| Following users      | Not needed for core loop               |
| Comments             | Toxic + low signal                     |
| Restaurant discovery | We discover DISHES                     |
| AI taste profiles    | Data first, AI later                   |
| Bookmarks/lists      | Rankings replace lists                 |
| Reservations/menus   | We're not OpenTable                    |
| Owner portals        | We care about eaters, not owners (yet) |
| Global leaderboards  | Too abstract early                     |

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

| Metric                 | Target                              |
| ---------------------- | ----------------------------------- |
| Dishes rated           | 500+                                |
| Comparisons logged     | 2,000+                              |
| App downloads          | 1,500+                              |
| DAU                    | 200+                                |
| Leaderboard confidence | Top 3 per category have 50+ battles |
| Press mentions         | 3+ local                            |
| Organic shares         | 100+ share cards                    |

---

## Future Roadmap (Post v0.1)

| Version | Key Additions                                                         |
| ------- | --------------------------------------------------------------------- |
| v0.1    | Core loop, 5 dishes, NOLA only                                        |
| v0.2    | Expand to 10 dishes, add Houston/Austin, Founding Fork badges visible |
| v0.3    | AI taste profiles, personalized rankings                              |
| v0.4    | Social layer (follow experts), "Dish Expert" verification             |
| v1.0    | National rollout, restaurant owner dashboards, API                    |

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

**Last Review:** 2026-02-01
**Next Review:** Weekly during v0.1 development
