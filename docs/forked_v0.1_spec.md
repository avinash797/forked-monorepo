# Forked v0.1 — Final MVP Specification
## Revised After Expert Synthesis

---

## What Changed (And Why)

| Original Idea | Expert Push | Final Decision |
|---------------|-------------|----------------|
| 1-10 rating slider | "This vs That" Elo battles | **ADOPT** — Elo is objectively better. Kills rating inflation, feels like a game, generates cleaner data |
| Photo encouraged | Photo **mandatory** | **ADOPT** — No photo, no proof. This is our verification layer for v0.1 |
| Categories as browsing | Categories as **hard limit** (5 dishes only at launch) | **ADOPT** — Scarcity creates focus. We own 5 dishes deeply before expanding |
| Leaderboard by city | Leaderboard by city **AND neighborhood** | **ADOPT** — "Best Gumbo in Tremé" is more useful than "Best Gumbo in New Orleans" |
| Founding Forks (10-15) | Pay 20-30 seeders | **MODIFY** — Hybrid: 10 unpaid obsessives for authenticity + 15 paid for coverage |
| AI taste profile (cut) | Collect tags NOW, AI later | **ADOPT** — Optional quick tags after comparison ("Dark roux", "Seafood-heavy") |
| Share cards | "Best Ever" auto-memory | **ADOPT + ENHANCE** — Personal "Best Ever" per dish becomes the share moment |

---

## The Ruthless MVP v0.1

### The Mantra
> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

If a feature doesn't serve that, it's out.

---

## The Core Loop (Non-Negotiable)

```
EAT → SNAP → COMPARE → RANK
```

1. **Eat** a dish
2. **Snap** a photo (mandatory)
3. **Compare** it against another dish you've had (This vs That)
4. **Rank** updates automatically via Elo
5. **Benefit** later when deciding what to eat

This is the Data Flywheel. Everything serves it.

---

## The Dish Object (Atomic Unit)

Every rating creates a `Dish` entity:

```
Dish
├── dish_type (controlled vocabulary: "Gumbo", "Po'boy", etc.)
├── restaurant_id
├── city + neighborhood
├── photo_url (REQUIRED)
├── elo_score (global, city, neighborhood)
├── confidence_score (based on # of battles won)
├── taste_tags[] (optional: "Dark roux", "Spicy", "Crispy")
└── created_at, user_id
```

### What's NOT on a Dish
- ❌ Long reviews
- ❌ Star ratings
- ❌ Price ranges
- ❌ Menu links

---

## The "This vs That" Engine (Elo Rating)

**Why Elo > Star Ratings:**
- 5-star systems are broken (everything clusters at 4.2-4.7)
- Elo is relative: "Is this gumbo better than THAT gumbo?"
- Removes subjectivity ("What does a 7 even mean?")
- Feels like a game (engagement)
- Generates cleaner ranking data

**The Flow:**
1. User submits new dish with photo
2. System shows split screen: "Which Gumbo wins?"
   - Left: Your new photo
   - Right: A highly-rated gumbo you've had before (or random if first)
3. User taps winner
4. Optional: Quick tag tap ("Seafood-heavy", "Rich", "Smoky") — skippable
5. Elo scores update immediately

**Elo Algorithm (Simplified):**
```python
K = 32  # sensitivity factor
expected_a = 1 / (1 + 10^((elo_b - elo_a) / 400))
new_elo_a = elo_a + K * (result - expected_a)
# result = 1 if A wins, 0 if B wins
```

**Confidence Score:**
```
confidence = log(total_battles) * win_rate
min_battles = 5 to appear on leaderboard
```

---

## Verification Layer (v0.1 = Friction, Not Bureaucracy)

| Check | Implementation |
|-------|----------------|
| Photo required | No photo = no submission |
| Location check | EXIF data or GPS API confirms proximity to restaurant |
| Time window | Must post within 4 hours of being at venue |
| Community flagging | Soft flags (3+ flags = human review) |

**What's NOT in v0.1:**
- ❌ Receipt uploads
- ❌ Manual moderation army
- ❌ Complex ML fraud detection

---

## Launch Dishes (NOLA Only)

**Hard limit: 5 dish types at launch.**

| Dish | Why |
|------|-----|
| 🍲 Gumbo | The iconic NOLA dish. Fierce local opinions. |
| 🥪 Po'boy | High frequency, clear "best" debates (Parkway vs Domilise's) |
| 🍗 Fried Chicken | Willie Mae's territory. Emotional. |
| 🥙 Muffuletta | Central Grocery vs everyone else |
| 🦞 Crawfish Étouffée | Seasonal, passionate fanbase |

**Expansion rule:** Add 2 new dish types only after 500+ comparisons in existing categories.

---

## The 5 Screens (Revised)

### Screen 1: Home — "What Should I Eat Right Now?"

**Purpose:** Kill decision fatigue in 3 seconds.

**UI:**
- Location badge at top ("📍 French Quarter")
- Dish selector pills: `Gumbo` `Po'boy` `Fried Chicken` `Muffuletta` `Étouffée`
- **Hero card** (one result, not a list):
  ```
  #1 GUMBO NEAR YOU
  ━━━━━━━━━━━━━━━━━
  Dooky Chase
  Tremé · 0.4 mi
  
  🔥🔥🔥🔥🔥 Confidence
  
  [Photo]
  
  [Show #2 and #3]  [Get Directions]
  ```
- Floating camera button (FAB) bottom right

**This screen alone should make the app worth keeping.**

---

### Screen 2: Dish Leaderboard

**Purpose:** Establish authority. Settle arguments.

**UI:**
- Header: "Best Gumbo in New Orleans"
- Toggle: `City` | `Near Me (2mi)` | `Tremé`
- Ranked list 1-10:
  ```
  👑 #1  Dooky Chase
        Tremé · 🔥🔥🔥🔥🔥
        [Photo thumbnail]
  
     #2  Willie Mae's
        7th Ward · 🔥🔥🔥🔥
        [Photo thumbnail]
  
     #3  Cochon
        Warehouse · 🔥🔥🔥🔥
        [Photo thumbnail]
  ```
- Each row tappable → Dish Detail

---

### Screen 3: Dish Detail

**Purpose:** Build trust before someone makes a trip.

**UI:**
- Hero photo (full width)
- Dish name + Restaurant name
- Ranking badge: "#1 Gumbo in New Orleans"
- Confidence meter (visual)
- Taste tags (crowd-sourced): `Dark roux` `Seafood-heavy` `Rich`
- Map snippet with directions CTA
- **"Compare This Dish"** button (feeds Elo engine)

**What's NOT here:**
- ❌ Comments
- ❌ Long reviews
- ❌ Price info

---

### Screen 4: This vs That (The Elo Engine)

**Purpose:** The data engine. Make it feel like a game.

**UI:**
- Full-screen split
- Top half: Photo A (your new dish or random)
- Bottom half: Photo B (comparison dish)
- Center prompt: **"Which Gumbo wins?"**
- Tap either photo to vote
- After vote:
  - Quick tag options (optional, skippable): `Spicy` `Smoky` `Crispy` `Rich`
  - "Thanks! Rankings updated." → dismiss

**This screen should feel like Tinder for food.**

---

### Screen 5: Profile — "Your Taste History"

**Purpose:** Personal reward. Make users care about contributing.

**UI:**
- Avatar + username + home city
- **"Best Ever" Cards** (auto-generated):
  ```
  ┌─────────────────────────┐
  │ 👑 MY #1 GUMBO EVER     │
  │                         │
  │ Dooky Chase             │
  │ New Orleans · Dec 2024  │
  │                         │
  │ [Photo]        [Share]  │
  └─────────────────────────┘
  ```
- Stats row: `47 dishes` · `3 cities` · `127 battles`
- Badges: "Gumbo Authority" (10+ gumbo comparisons)
- Map view toggle: pins of what you've eaten where

---

## Cold-Start Strategy: New Orleans

### Why NOLA First (Confirmed)
1. Iconic dishes with fierce local opinions
2. Clear "hole in the wall" culture
3. Tourist destination (built-in discovery use case)
4. Anti-Yelp sentiment among locals
5. Compact geography (easy to seed)

---

### Phase 1: Dish Seeding (Weeks 1-3, Pre-Launch)

**Goal:** 200+ dishes rated, 500+ comparisons logged before public launch.

**The Hybrid Crew:**

| Type | Count | Compensation | Role |
|------|-------|--------------|------|
| True Believers | 10 | "Founding Fork" badge + early access | Authentic opinions, passionate voices |
| Paid Seeders | 15-20 | $15/dish entry | Coverage of top 50 NOLA staples |

**The Task:**
- Each seeder hits 10-15 restaurants
- Mandatory: Photo + location + comparison
- Focus on the 5 launch dishes
- Cover both legends (Commander's, Parkway) AND holes-in-the-wall

**Seeding Targets:**
```
Gumbo: 50 dishes from 30 restaurants
Po'boy: 50 dishes from 25 restaurants
Fried Chicken: 40 dishes from 20 restaurants
Muffuletta: 30 dishes from 15 restaurants
Étouffée: 30 dishes from 20 restaurants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 200 dishes minimum
```

---

### Phase 2: Closed Beta (Week 4)

**Distribution (Locals Only):**
- QR codes at bars (not restaurants)
- Bartenders and servers (they know the real spots)
- r/NewOrleans, NOLA Twitter food circles
- Physical stickers at hole-in-the-wall spots ONLY

**Messaging:**
> "This app ranks dishes, not restaurants. Help us settle arguments."

**The Hook (Hole in the Wall Campaign):**
- Stickers/QR codes at gas station chicken spots, corner stores, dive bars
- Prompt: "Is this gas station fried chicken better than Willie Mae's? Vote now."

---

### Phase 3: Public Launch (Week 5-6)

**"The List" Drop:**
- Publish "Forked's Top 10 Gumbo in New Orleans" on social
- Include 1-2 controversial picks intentionally
- CTA: "Disagree? Download Forked and vote."

**"Dish Wars" Campaign:**
- Weekly "King of [Dish]" announcements on Instagram/TikTok
- Example: "The Great NOLA Burger Bracket" (even though burger isn't launch dish—tease future)
- Restaurants share because it's about FOOD QUALITY, not service/ambiance

**Restaurant Outreach:**
- DM hole-in-the-wall spots: "You're ranked #7 for best gumbo in NOLA"
- They become organic promoters

---

### Phase 4: Tourist Capture (Week 6+)

**SEO Play:**
- Landing pages: "Best Gumbo in New Orleans 2026"
- Apple Maps / Google local search hooks (later)

**The insight:** Tourists don't need accounts. They just need confidence. Leaderboards are public.

---

### Success Metrics (30 Days Post-Launch)

| Metric | Target |
|--------|--------|
| Dishes rated | 500+ |
| Comparisons logged | 2,000+ |
| App downloads | 1,500+ |
| DAU | 200+ |
| Leaderboard confidence | Top 3 in each category have 50+ battles |
| Press/blog mentions | 3+ local |
| Organic shares | 100+ share cards generated |

---

## What's NOT in v0.1 (The Kill List)

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

## The Moat (Strategic Truth)

> Your real moat is not AI. Your moat is **dish-level truth + friction that filters liars.**

AI becomes lethal AFTER:
- 100k comparisons
- 10k verified dishes
- Clear taste vectors from tags

If you nail v0.1 exactly as above, Forked won't just disrupt Beli—it'll make venue ratings feel outdated.

---

## Roadmap Preview

| Version | Key Additions |
|---------|---------------|
| v0.1 | Core loop, 5 dishes, NOLA only |
| v0.2 | Expand to 10 dishes, add Houston/Austin, Founding Fork badges visible |
| v0.3 | AI taste profiles ("You like: dark roux, crispy, spicy"), personalized rankings |
| v0.4 | Social layer (follow experts, not friends), "Dish Expert" verification |
| v1.0 | National rollout, restaurant owner dashboards, API for press/media |

---

## Final Word

The experts confirmed what you already intuited: **dish-level data is the unlock.** 

But they sharpened the weapon:
- Elo > star ratings (kills subjectivity)
- 5 dishes > all dishes (focus wins)
- Friction = verification (no receipts needed)
- Hole-in-the-wall energy > influencer polish

Execute this spec exactly, and you don't just build an app—you build the **source of truth** for "what should I eat."

Let's go.
