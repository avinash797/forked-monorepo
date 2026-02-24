# Forked v0.1 — Final MVP Specification
## Revised After Expert Synthesis

---

## What Changed (And Why)

| Original Idea | Expert Push | Final Decision |
|---------------|-------------|----------------|
| Numeric score input | Three-bucket sentiment + binary insertion sort battles | **ADOPT + IMPROVE** — Users pick Liked / Okay / Didn't Like, then battle within that zone. Kills rating inflation AND score compression. Scores always mean what they say: 7.0+ is always liked, 4.0–6.9 is always okay, below 4.0 is always disliked. |
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
4. **Rank** updates automatically via bucket-anchored score derivation
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
├── sentiment (liked / okay / disliked)
├── derived_score (7.0–10.0 if liked, 4.0–6.9 if okay, 1.0–3.9 if disliked)
├── community_score (Bayesian-smoothed, photo-weighted aggregate)
├── confidence_tier (low / medium / high / very_high)
├── taste_tags[] (optional: "Dark roux", "Spicy", "Crispy")
└── created_at, user_id
```

### What's NOT on a Dish
- ❌ Long reviews
- ❌ Star ratings
- ❌ Price ranges
- ❌ Menu links

---

## The Rating Engine (Three-Tier System)

**Why Three Buckets + Battles > Numeric Ratings:**
- Numeric scales are broken ("What does a 7 even mean?")
- Pure positional systems compress power users — Beli users with 1,000+ ratings see their top 275 all score 9.0+
- Sentiment buckets anchor scores permanently: a liked dish is always 7.0–10.0, full stop
- Battles happen within a zone only — at most 6–7 taps to fully rank a new dish
- Feels like a game. Generates cleaner data. Scores users can actually trust.

**The Flow:**
1. User selects restaurant → selects dish type
2. User picks sentiment: **"Liked it!"** / **"It was okay"** / **"Didn't like it"**
3. User adds photo (mandatory) + optional taste tags + optional notes
4. User submits → system runs binary insertion sort battles *within that sentiment zone only*
   - "Which Gumbo wins?" — same bucket, same dish type
5. User taps winner (max 6–7 battles even with a large list), can skip with limited skips
6. Score derived automatically from rank position within bucket

**Score Ranges (Hard Boundaries):**

| Sentiment | Score Floor | Score Ceiling |
|---|---|---|
| Liked it | 7.0 | 10.0 |
| It was okay | 4.0 | 6.9 |
| Didn't like it | 1.0 | 3.9 |

A liked dish can never score below 7.0, no matter how many other liked dishes exist above it.

**Score Derivation:**
```
score = ceiling − (rank_in_bucket − 1) / (bucket_size − 1) × (ceiling − floor)
```
Example: 8th-favorite liked dish out of 15 liked dishes → `10.0 − (7/14) × 3.0 = 8.5`

**Max Battles Per Rating (within sentiment zone):**

| Items in Zone | Max Battles |
|---|---|
| 1–2 | 1 |
| 3–4 | 2 |
| 5–8 | 3 |
| 9–16 | 4 |
| 17–32 | 5 |
| 33–64 | 6 |
| 65–128 | 7 |

**Community Score (Bayesian-Smoothed):**
```
bayesian = (Σwᵢsᵢ + C·m) / (Σwᵢ + C)
wᵢ = 1.0 (all v0.1 ratings require photos; 0.5 reserved for future no-photo ratings)
C  = 5 (prior strength, flat for v0.1; future: neighborhood=3, city=5, state=8)
m  = global mean for that dish type in same city
```

**Confidence Tiers:**

| Weighted Rating Count | Tier | Display |
|---|---|---|
| < C | Low | "Few ratings" |
| C to 2C | Medium | "Some ratings" |
| 2C to 5C | High | "Well rated" |
| > 5C | Very High | "Crowd favorite" |

---

## Verification Layer (v0.1 = Friction, Not Bureaucracy)

| Check | Implementation | Status |
|-------|----------------|--------|
| Photo required | No photo = no submission | **Enforced** — `photo_url NOT NULL` in DB, UI blocks submit without photo |
| Location check | GPS API confirms proximity to restaurant | **Partial** — GPS captured, `location_verified` stored, distance not yet enforced |
| EXIF extraction | Photo EXIF location/timestamp extracted | **Schema ready** — `exif_location` + `exif_timestamp` columns exist, extraction not yet wired |
| Time window | Must post within 4 hours of being at venue | **Not yet enforced** — planned for post-launch hardening |
| Community flagging | Soft flags (3+ flags = human review) | **Schema ready** — `content_flags` table exists, no UI yet |

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

## The Screens

### Tab 1: Home / Discover — "What Should I Eat Right Now?"

**Purpose:** Kill decision fatigue in 3 seconds.

**UI:**
- Location badge at top ("📍 French Quarter")
- Dish selector pills: `Gumbo` `Po'boy` `Fried Chicken` `Muffuletta` `Étouffée`
- **Hero card** (one result per dish type — photo-dominant with gradient overlay):
  ```
  #1 GUMBO NEAR YOU
  ━━━━━━━━━━━━━━━━━
  Dooky Chase
  Tremé · 0.4 mi

  🔥🔥🔥🔥🔥 Confidence

  [Photo]
  ```
- **Rising star card** (high-scored, low-battle-count discovery for selected type)
- **Recent battle ticker** (live community activity feed, refreshes every 30s)
- **Pending comparisons CTA** (if user has unfinished battle sequences)
- Floating camera button (center tab FAB) to start rating flow

**This screen alone should make the app worth keeping.**

---

### Tab 2: Community Leaderboard

**Purpose:** Establish authority. Settle arguments.

**UI:**
- Header: "Best Gumbo in New Orleans"
- Dish type pills (toggleable)
- Location toggle: `City` | `Near Me (2mi)` | `Neighborhood`
- Ranked list 1-10 (ordered by `bayesian_score DESC`):
  ```
  👑 #1  Dooky Chase
        Tremé · 🔥🔥🔥🔥🔥
        [Photo thumbnail]  [Score Badge]

     #2  Willie Mae's
        7th Ward · 🔥🔥🔥🔥
        [Photo thumbnail]  [Score Badge]

     #3  Cochon
        Warehouse · 🔥🔥🔥🔥
        [Photo thumbnail]  [Score Badge]
  ```
- Each row tappable → Dish Detail
- Score badge color-coded: green (7.0+), yellow (4.0–6.9), red (<4.0)

---

### Tab 3 (Center FAB): Rate a Dish

**Purpose:** Entry point into the EAT → SNAP → COMPARE → RANK loop.

Center tab button (FAB-style) that launches the rating flow as a modal stack:
1. **Photo capture** → camera or gallery (mandatory)
2. **Restaurant search** → GPS-sorted, with "add new" option
3. **Dish type selection** → controlled vocabulary only
4. **Rating screen** → sentiment picker + photo preview + optional taste tags + optional notes
5. **This vs That battles** → if sentiment zone has existing items (conditional)

---

### Browse: Dish Detail

**Purpose:** Build trust before someone makes a trip.

**UI:**
- Hero photo (full width) with parallax scrolling
- Dish name + Restaurant name
- Ranking badge: "#X Gumbo in New Orleans"
- Confidence meter (visual tier display)
- Taste tags (crowd-sourced): `Dark roux` `Seafood-heavy` `Rich`
- Map card with directions CTA
- Photo gallery from all community ratings
- **"Rate This Dish"** button (enters rating + battle flow)

**What's NOT here:**
- ❌ Comments
- ❌ Long reviews
- ❌ Price info

---

### Browse: Restaurant Detail

**Purpose:** See all rated dishes at a restaurant.

**UI:**
- Hero image with parallax scrolling
- Animated sticky header
- Restaurant info (name, address, neighborhood)
- All rated dish types at this restaurant with scores
- Tappable → navigates to dish detail

---

### Rating Flow: This vs That (The Battle Engine)

**Purpose:** The data engine. Make it feel like a game.

**UI:**
- Full-screen split (vertical cards)
- Top card: Photo A (your new dish) with "NEW" badge
- Bottom card: Photo B (opponent from your same sentiment zone)
- Center VS circle divider
- Header prompt: **"Which [Dish Type] wins?"**
- Step progress: "Step 1 of 4"
- Tap either photo to vote
- Skip button with remaining count (limited skips per sequence = `floor(max_battles / 3)`)
- Skip reason modal (bottom sheet): "Can't remember", "Too different", "Haven't tried recently", etc.
- At most 6–7 taps to fully rank a new dish — battles stay within the sentiment zone
- On completion: rankings updated, navigate back to home

**This screen should feel like Tinder for food.**

---

### Tab 4: Personal Rankings

**Purpose:** See your own ranked list per dish type.

**UI:**
- Title: "Your Best [Dish Type]"
- Dish type pills (filtered to types you've rated)
- Ranked list ordered by `rank_position ASC` with `derived_score` shown
- Each row tappable → Dish Detail
- Empty state with CTA to rate a dish

---

### Tab 5: Profile — "Your Taste History"

**Purpose:** Personal reward. Make users care about contributing.

**UI:**
- Avatar + username + home city
- **"Best Ever" Cards** (auto-generated, horizontal scrolling):
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
- Badges: "Gumbo Authority" (10+ gumbo comparisons), milestone badges
- Activity history and reviews tabs

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
| Leaderboard confidence | Top 3 in each category reach `very_high` tier (25+ weighted ratings) |
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
- Sentiment buckets + binary insertion sort > numeric scales (kills subjectivity AND score compression)
- 5 dishes > all dishes (focus wins)
- Friction = verification (no receipts needed)
- Hole-in-the-wall energy > influencer polish

Execute this spec exactly, and you don't just build an app—you build the **source of truth** for "what should I eat."

Let's go.
