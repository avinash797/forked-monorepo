# Dish-Level Rating Algorithm Design

## Complete System Specification

**Version:** 1.0 — MVP Architecture
**Date:** February 2026

---

## Table of Contents

1. [Design Philosophy & Beli Lessons](#1-design-philosophy--beli-lessons)
2. [Data Model & Schema](#2-data-model--schema)
3. [Phase 1: Three-Bucket Sentiment Classification](#3-phase-1-three-bucket-sentiment-classification)
4. [Phase 2: Binary Insertion Sort (Battles)](#4-phase-2-binary-insertion-sort-battles)
5. [Phase 3: Score Derivation — Bucket-Anchored Interpolation](#5-phase-3-score-derivation--bucket-anchored-interpolation)
6. [Phase 4: Area Leaderboard Aggregation](#6-phase-4-area-leaderboard-aggregation)
7. [Phase 5: Food Recommendations](#7-phase-5-food-recommendations)
8. [Anti-Gaming Properties](#8-anti-gaming-properties)
9. [Edge Cases & Failure Modes](#9-edge-cases--failure-modes)
10. [Implementation Priorities](#10-implementation-priorities)

---

## 1. Design Philosophy & Beli Lessons

### What Beli Gets Right

Beli's core insight is brilliant: **don't ask users for a number — derive one from pairwise preferences**. The three-bucket → binary insertion sort → interpolation pipeline is elegant, low-friction, and produces richer preference data than any star-rating system. We adopt this pipeline wholesale.

### What Beli Gets Wrong (And What We Fix)

| Beli Problem | Root Cause | Our Solution |
|---|---|---|
| **Score compression for power users** — A user with 1,000+ ratings sees their top 275 all scored 9.0+ | Pure linear interpolation across the entire list treats position as the only signal; the initial sentiment bucket is discarded after sorting | **Bucket-anchored interpolation** — the three sentiment buckets define hard score ceilings/floors, so "liked it" items can never compress into "okay" territory regardless of list length |
| **Apples-to-oranges comparisons** — Comparing a taco stand to a Michelin restaurant | Beli only recently added broad category separation (restaurants/bars/coffee); within "restaurants" everything still mixes | **Dish-type isolation** — battles happen exclusively within a dish type. Your burger leaderboard is untouched by your pizza opinions. This is the single biggest structural improvement. |
| **No credibility signal** — All ratings count equally toward community scores | No verification mechanism for whether someone actually visited/ate there | **Photo weight** — ratings with photos carry 1.0 weight toward community leaderboards; no-photo ratings carry 0.5. Personal leaderboards are unaffected. |
| **No confidence indicator** — A restaurant with 2 ratings and one with 200 look the same on the community leaderboard | Simple averaging without Bayesian smoothing | **Bayesian-smoothed community scores** with an explicit confidence tier displayed to users |

### Core Design Principles

1. **Battles are always burger-vs-burger** (or pizza-vs-pizza, etc.) — never cross-type.
2. **The sentiment bucket is permanent metadata** — it anchors score ranges, not just search zones.
3. **Personal leaderboards are sovereign** — photo weight, smoothing, and confidence only affect community/area leaderboards.
4. **Replace-on-revisit** — re-rating the same dish at the same restaurant replaces the old entry and triggers a fresh battle sequence.

---

## 2. Data Model & Schema

### Core Entities

```
┌─────────────────────────────────────────────────┐
│ USER                                            │
│  user_id (PK)                                   │
│  username                                       │
│  home_location (lat/lng)                        │
│  created_at                                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ RESTAURANT                                      │
│  restaurant_id (PK)                             │
│  name                                           │
│  address                                        │
│  neighborhood, city, state, country             │
│  lat, lng                                       │
│  created_at                                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ DISH_TYPE                                       │
│  dish_type_id (PK)                              │
│  name (burger, pizza, cheesesteak, poboy, etc.) │
│  display_name                                   │
│  icon                                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ RATING                                          │
│  rating_id (PK)                                 │
│  user_id (FK → USER)                            │
│  restaurant_id (FK → RESTAURANT)                │
│  dish_type_id (FK → DISH_TYPE)                  │
│  sentiment (liked / okay / disliked)            │
│  has_photo (boolean)                            │
│  photo_url (nullable)                           │
│  tags (JSON array, optional)                    │
│  notes (text, optional)                         │
│  created_at                                     │
│  updated_at                                     │
│  UNIQUE(user_id, restaurant_id, dish_type_id)   │
│    ↑ enforces replace-on-revisit                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PERSONAL_LEADERBOARD                            │
│  user_id (FK → USER)                            │
│  dish_type_id (FK → DISH_TYPE)                  │
│  rating_id (FK → RATING)                        │
│  rank_position (integer, 1 = best)              │
│  derived_score (decimal 0.0–10.0)               │
│  PK(user_id, dish_type_id, rating_id)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ BATTLE_LOG                                      │
│  battle_id (PK)                                 │
│  user_id (FK → USER)                            │
│  dish_type_id (FK → DISH_TYPE)                  │
│  new_rating_id (FK → RATING)                    │
│  opponent_rating_id (FK → RATING)               │
│  winner_rating_id (FK → RATING, nullable)       │
│  result (new_wins / opponent_wins / skipped)     │
│  step_number (integer, 1-indexed)               │
│  created_at                                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ COMMUNITY_SCORE (materialized / cached)         │
│  restaurant_id (FK)                             │
│  dish_type_id (FK)                              │
│  geo_level (neighborhood/city/state/country)    │
│  geo_id (FK to geo lookup)                      │
│  bayesian_score (decimal 0.0–10.0)              │
│  raw_weighted_avg (decimal)                     │
│  total_ratings (integer)                        │
│  weighted_rating_count (decimal)                │
│  confidence_tier (low/medium/high/very_high)    │
│  last_computed_at                               │
│  PK(restaurant_id, dish_type_id, geo_level,     │
│     geo_id)                                     │
└─────────────────────────────────────────────────┘
```

### Key Constraint: Replace-on-Revisit

The `UNIQUE(user_id, restaurant_id, dish_type_id)` constraint on RATING means one user can only have one active rating for "burgers at Joe's Diner." If they re-rate, the old RATING row is updated (sentiment, photo, tags, notes, updated_at), the old PERSONAL_LEADERBOARD entry is removed, and a fresh battle sequence runs to re-insert. Old BATTLE_LOG entries are preserved for analytics but marked as superseded.

---

## 3. Phase 1: Three-Bucket Sentiment Classification

### User Flow

After selecting restaurant + dish type, the user sees three options:

- **"Liked it!"** → `sentiment = liked`
- **"It was okay"** → `sentiment = okay`
- **"Didn't like it"** → `sentiment = disliked`

### Algorithmic Purpose (Enhanced from Beli)

In Beli's system, the three buckets serve only as a **search zone optimization** — they narrow the binary search to roughly the top/middle/bottom third of the list, then the sentiment is effectively discarded once the position is found. The score is purely positional.

**We do more.** The sentiment bucket serves two permanent purposes:

1. **Search zone seeding** (same as Beli) — the new item enters the binary search in the correct region.
2. **Score range anchoring** (our improvement) — the sentiment permanently constrains the score range for that item. See Phase 3 for the full interpolation design.

### Zone Boundaries

For a user's existing leaderboard of `n` items within a dish type, we define the three zones based on the existing sentiment distribution, not fixed thirds:

```
Zone for "liked"    → items ranked 1 through last_liked_position
Zone for "okay"     → items ranked first_okay_position through last_okay_position
Zone for "disliked" → items ranked first_disliked_position through n
```

If a zone is empty (user has never rated a burger as "okay"), the new item seeds at the boundary between adjacent zones. Example: if a user has 20 "liked" burgers and 5 "disliked" burgers but no "okay," a new "okay" burger would start the battle sequence at position 21 (just below the last liked item).

---

## 4. Phase 2: Binary Insertion Sort (Battles)

### The Battle Sequence

Once the new rating is seeded into the correct sentiment zone, we run a binary insertion sort within that zone:

```
FUNCTION insert_into_leaderboard(new_rating, user, dish_type):
    leaderboard = get_sorted_leaderboard(user, dish_type)
    zone = get_zone_for_sentiment(leaderboard, new_rating.sentiment)

    low = zone.start_index
    high = zone.end_index
    skips_remaining = max_skips(zone.size)

    WHILE low < high:
        mid = floor((low + high) / 2)
        opponent = leaderboard[mid]

        result = present_battle(new_rating, opponent)

        IF result == NEW_WINS:
            high = mid           // new item is better → search upper half
        ELSE IF result == OPPONENT_WINS:
            low = mid + 1        // opponent is better → search lower half
        ELSE IF result == SKIPPED:
            skips_remaining -= 1
            IF skips_remaining <= 0:
                // Force decision on next battle
                disable_skip_button()
            insert_position = mid  // park at midpoint temporarily
            // Continue search from same position with tighter bounds
            // (effectively a no-op for this round)
            low = mid
            high = mid
        END IF

        log_battle(new_rating, opponent, result)
    END WHILE

    insert_at_position(leaderboard, low, new_rating)
    recalculate_scores(user, dish_type)
```

### Maximum Comparisons

Since battles only occur within a sentiment zone (not the full leaderboard), the number of comparisons is even lower than Beli's:

| Items in Sentiment Zone | Max Battles |
|---|---|
| 1–2 | 1 |
| 3–4 | 2 |
| 5–8 | 3 |
| 9–16 | 4 |
| 17–32 | 5 |
| 33–64 | 6 |
| 65–128 | 7 |

A user who has rated 100 burgers, of which 60 are in the "liked" zone, will face at most 6 battles when adding a new liked burger. Beli would potentially require searching across all 100.

### Skip Limits

The maximum number of skips allowed per battle sequence is:

```
max_skips = max(1, floor(total_battles_in_sequence / 3))
```

So a 6-battle sequence allows 2 skips. A 3-battle sequence allows 1. This prevents users from bypassing the system while still offering an escape valve for genuinely impossible comparisons.

When a skip occurs, the item is parked at the current midpoint, which is the most statistically defensible position given the information available (it's the expected value of the item's position given no preference signal).

### Cold Start (First Few Ratings)

For a user's first 1–3 ratings within a dish type, there are too few items for meaningful battles:

- **1st rating:** No battle. Item is placed as #1 in its sentiment zone.
- **2nd rating:** One battle. "Did you prefer the burger at Joe's or the burger at Tony's?"
- **3rd rating:** One or two battles via binary search.

No special-casing needed — the binary search handles these naturally.

---

## 5. Phase 3: Score Derivation — Bucket-Anchored Interpolation

This is the key algorithmic improvement over Beli. Rather than a single linear interpolation from position 1 (score 10.0) to position n (score ~1.0), we anchor score ranges to sentiment buckets.

### Score Range Anchors

| Sentiment | Score Floor | Score Ceiling |
|---|---|---|
| **Liked** | 7.0 | 10.0 |
| **Okay** | 4.0 | 6.9 |
| **Disliked** | 1.0 | 3.9 |

These are hard boundaries. A burger the user said they "liked" will never score below 7.0, no matter how many other liked burgers are above it. A burger they "didn't like" will never score above 3.9. This is what prevents Beli's compression problem.

### Interpolation Within Each Bucket

Within each sentiment bucket, scores are distributed via linear interpolation based on position:

```
FUNCTION calculate_score(rank_in_bucket, bucket_size, sentiment):
    (floor, ceiling) = get_score_range(sentiment)

    IF bucket_size == 1:
        RETURN (floor + ceiling) / 2    // midpoint

    // rank_in_bucket is 1-indexed (1 = best in this bucket)
    normalized_position = (rank_in_bucket - 1) / (bucket_size - 1)
    score = ceiling - normalized_position * (ceiling - floor)

    RETURN round(score, 1)    // one decimal place
```

### Worked Example

A user has rated 25 burgers:
- 15 × "liked" (ranks 1–15 on leaderboard)
- 7 × "okay" (ranks 16–22)
- 3 × "disliked" (ranks 23–25)

Score assignments:

| Leaderboard Rank | Sentiment | Rank Within Bucket | Score |
|---|---|---|---|
| 1 | liked | 1 of 15 | 10.0 |
| 2 | liked | 2 of 15 | 9.8 |
| 8 | liked | 8 of 15 | 8.5 |
| 15 | liked | 15 of 15 | 7.0 |
| 16 | okay | 1 of 7 | 6.9 |
| 19 | okay | 4 of 7 | 5.5 |
| 22 | okay | 7 of 7 | 4.0 |
| 23 | disliked | 1 of 3 | 3.9 |
| 24 | disliked | 2 of 3 | 2.5 |
| 25 | disliked | 3 of 3 | 1.0 |

### Why This Beats Pure Linear Interpolation

Consider a power user with 200 rated burgers, 150 of which are "liked." Under Beli's pure linear interpolation, those 150 liked burgers would span from 10.0 down to roughly 2.5 — meaning their 100th-favorite liked burger scores a 5.0, which feels absurd for something they explicitly said they liked.

Under our system, those 150 liked burgers span from 10.0 to 7.0. The score spacing is tighter (0.02 per position), but every liked burger still scores in the "liked" range. A user looking at their leaderboard will see scores that match their stated sentiment — 7.0+ items are all things they liked, 4.0–6.9 are things that were fine, and below 4.0 are things they disliked. The number always means something.

### Score Recalculation

Every time a new rating is inserted (or an old one replaced), all scores within the affected dish type for that user are recalculated. This is cheap — it's a single pass over the leaderboard applying the interpolation formula. For a leaderboard of 200 items, this is O(200) with trivial computation per item.

---

## 6. Phase 4: Area Leaderboard Aggregation

The area leaderboard answers: **"What's the best burger in New Orleans?"** This requires aggregating personal scores across users with Bayesian smoothing and photo-based credibility weighting.

### Step 1: Weighted Average Per Dish-Restaurant Pair

For each (restaurant, dish_type) pair within a geographic area, we compute a weighted average of all users' personal derived scores:

```
FUNCTION weighted_average(restaurant, dish_type, geo_area):
    ratings = get_all_ratings(restaurant, dish_type, geo_area)

    weighted_sum = 0
    weight_total = 0

    FOR EACH rating IN ratings:
        w = photo_weight(rating)    // 1.0 if has_photo, 0.5 if not
        weighted_sum += rating.derived_score * w
        weight_total += w

    IF weight_total == 0:
        RETURN null

    RETURN weighted_sum / weight_total
```

### Step 2: Bayesian Smoothing (Prior-Regularized Score)

A single 10.0 rating shouldn't crown a restaurant the best burger in the city. We use a Bayesian prior to pull low-sample-size scores toward the global mean:

```
FUNCTION bayesian_score(raw_weighted_avg, weighted_count, dish_type, geo_area):
    // C = prior strength (minimum credible sample size)
    // m = prior mean (global average for this dish type in this geo)
    C = prior_strength(dish_type, geo_area)
    m = global_mean(dish_type, geo_area)

    RETURN (weighted_count * raw_weighted_avg + C * m) / (weighted_count + C)
```

**Prior strength `C`** is tuned per dish type and geography. The intuition: `C` represents how many weighted rating-equivalents a restaurant needs before we trust its score over the global average. Suggested starting values:

| Context | C Value | Rationale |
|---|---|---|
| Neighborhood level | 3 | Small areas, fewer total ratings expected |
| City level | 5 | Moderate sample needed |
| State level | 8 | Higher bar for state-level claims |
| Country level | 12 | High confidence required |

**Prior mean `m`** is the weighted average score across all restaurants for that dish type in the geographic area. For a new city with sparse data, it falls back to the state-level mean, then country-level.

### Step 3: Confidence Tiers

Rather than showing users a raw count, we translate the weighted rating count into an intuitive confidence tier:

| Weighted Count | Tier | Display |
|---|---|---|
| < C | **Low** | "Few ratings" |
| C to 2C | **Medium** | "Some ratings" |
| 2C to 5C | **High** | "Well rated" |
| > 5C | **Very High** | "Crowd favorite" |

The tier is displayed alongside the score so users can calibrate trust. A 9.2 with "Few ratings" signals a different level of reliability than a 9.2 with "Crowd favorite."

### Step 4: Geographic Hierarchy

Scores are computed independently at each geographic level:

```
Neighborhood → City → State → Country
```

A restaurant appears on every level that contains its physical location. The Bayesian prior `C` and global mean `m` are computed per level, so a restaurant's score may differ slightly between the city and state leaderboards (because `C` and `m` differ).

For radius-based queries (nice-to-have), compute on the fly by gathering all restaurants within the radius and applying the same Bayesian formula with `C` calibrated to the radius size.

### Step 5: Materialization Strategy

Community scores should be precomputed and cached (the `COMMUNITY_SCORE` table), refreshed on a schedule:

- **Neighborhood/City:** Recompute every time a new rating is added for a restaurant in that area (event-driven), or at minimum every 15 minutes.
- **State/Country:** Recompute hourly or daily (batch job).

This avoids expensive aggregation on every leaderboard page view.

---

## 7. Phase 5: Food Recommendations

The recommendation answers: **"You should try the burger at Dat Dog"** — not "users like you also liked…" This is a dish-level recommendation, not a user-matching system.

### Recommendation Score Formula

For a user `U` who has NOT rated dish type `D` at restaurant `R`:

```
FUNCTION rec_score(user_U, restaurant_R, dish_type_D, geo_area):
    // Component 1: Community score (Bayesian-smoothed)
    community = bayesian_score(R, D, geo_area)
    IF community IS null:
        RETURN null    // Can't recommend what nobody has rated

    // Component 2: User's dish-type affinity
    // How does this user's average score for this dish type compare to their
    // overall average? If they love burgers more than average, boost burger recs.
    user_dish_avg = avg(user_U.derived_scores WHERE dish_type = D)
    user_overall_avg = avg(user_U.derived_scores, all dish_types)

    IF user_dish_avg IS null:
        // User has never rated this dish type — no affinity signal
        affinity_boost = 0
    ELSE:
        affinity_boost = (user_dish_avg - user_overall_avg) / 10.0
        // Clamped to [-0.3, +0.3] to prevent runaway boosts
        affinity_boost = clamp(affinity_boost, -0.3, 0.3)

    // Component 3: Sentiment alignment with community
    // If the user tends to agree with the community on this dish type
    // (their scores correlate with community scores for dishes they've both rated),
    // trust the community score more.
    alignment = sentiment_alignment(user_U, dish_type_D, geo_area)
    // alignment is 0.0 (no data or no correlation) to 1.0 (perfect agreement)

    // Blend: lean on community, adjust for affinity and alignment
    rec = community + affinity_boost * alignment

    RETURN clamp(rec, 1.0, 10.0)
```

### Sentiment Alignment Calculation

```
FUNCTION sentiment_alignment(user_U, dish_type_D, geo_area):
    // Find all (restaurant, dish_type) pairs where BOTH the user
    // and the community have scores
    overlap = get_overlap(user_U, dish_type_D, geo_area)

    IF overlap.count < 5:
        RETURN 0.0    // Not enough data to compute alignment

    // Pearson correlation between user's scores and community scores
    r = pearson_correlation(
        overlap.map(x => x.user_score),
        overlap.map(x => x.community_score)
    )

    // Only positive correlations are useful; negative means contrarian tastes
    // which means community scores are inversely predictive
    RETURN max(0.0, r)
```

### Recommendation Display Rules

1. Only show recommendations for (restaurant, dish_type) pairs with confidence tier ≥ Medium.
2. Sort recommendations by rec_score descending.
3. Display the confidence tier alongside the rec score.
4. If the user has rated < 5 items of this dish type, show a "Rate more [dish type] to improve recommendations" prompt instead of affinity-adjusted scores. Fall back to pure community score in this case.

---

## 8. Anti-Gaming Properties

### Inherited from the Beli Architecture

| Property | Mechanism |
|---|---|
| **No direct score input** | Scores are derived from rank position + sentiment. Users never type a number. |
| **Relational consistency** | Every rating is defined by battles. Inflating one item requires deflating another in the same dish type. |
| **Single bottom slot** | Only one item can be last in a bucket. Can't mass-tank competitors. |

### New Properties from Our Design

| Property | Mechanism |
|---|---|
| **Photo credibility weight** | Ratings without photos count half toward community scores. Fake-rating at scale requires producing unique food photos at scale. |
| **Dish-type isolation** | Gaming burgers requires actually rating many burgers. Can't inflate burger scores by manipulating pizza ratings. |
| **Bayesian smoothing** | A single perfect score doesn't move the needle. Need sustained volume from multiple users to shift a community score meaningfully. |
| **Sentiment anchoring** | Even if a user games their "liked" list to push one burger to #1, it can only ever score 10.0 — and their other liked burgers still score 7.0–10.0. The score range is bounded by the user's own sentiment declaration. |
| **Replace-on-revisit** | Can't create multiple ratings for the same (restaurant, dish_type) pair to amplify influence. One user = one vote per dish-restaurant pair. |

### Attack Scenario Analysis

**Attack: Fake accounts rating one restaurant's burger 10/10.**
Defense: Bayesian smoothing means each fake account contributes `1.0 / (1.0 + C)` of its weight toward moving the score. With C=5 at city level, you need ~25 fake photo-backed ratings just to get the score 80% of the way from the prior mean to 10.0. Without photos, you need ~50.

**Attack: User tanks a competitor by rating their burger poorly.**
Defense: That user's single 0.5-weighted (no photo) or 1.0-weighted rating is one voice among many. With Bayesian smoothing, the impact is negligible unless the restaurant has very few other ratings — in which case it'd be in the "Low confidence" tier anyway, signaling unreliability.

**Attack: User inflates their personal leaderboard to boost one restaurant.**
Defense: Their personal score for that burger is capped at 10.0 (the best "liked" position). Even if they game their list, their single score contributes one weighted vote to the community pool. The Bayesian prior absorbs it.

---

## 9. Edge Cases & Failure Modes

### Edge Case 1: User Changes Sentiment on Revisit

**Scenario:** User rated Joe's burger as "liked" (currently ranked #3 in their liked bucket, scoring 9.4). Six months later they revisit, and the burger was bad. They re-rate as "disliked."

**Handling:** The old rating is replaced. The item is removed from the "liked" zone and re-inserted via battles into the "disliked" zone. All scores in both affected zones are recalculated. The community score for Joe's burger is updated on the next refresh cycle.

### Edge Case 2: Empty Sentiment Zones

**Scenario:** User has rated 20 burgers, all as "liked." They now rate one as "okay."

**Handling:** The "okay" zone is created with this single item. No battle needed (it's the only item in its zone). It receives the midpoint score: (4.0 + 6.9) / 2 = 5.5. Future "okay" burgers will battle against it.

### Edge Case 3: Very Large Leaderboards

**Scenario:** Power user has 500 rated burgers — 350 liked, 100 okay, 50 disliked.

**Handling:** Within the "liked" zone, the maximum battle count is ⌊log₂(350)⌋ + 1 = 9. Score spacing in the liked zone: 3.0 / 349 ≈ 0.0086 per position. At one decimal place display, many adjacent items will share the same displayed score (e.g., twenty items all showing "8.3"). This is acceptable — users can still see the rank order in their leaderboard even when displayed scores are identical. The rank position is the source of truth; the score is a human-friendly approximation.

**Optional Enhancement for Power Users:** If score spacing drops below 0.05 per position within a bucket, consider switching to two decimal places for display within that bucket. This is a UI decision, not an algorithmic one.

### Edge Case 4: Restaurant Has Very Few Community Ratings

**Scenario:** A new restaurant has only 1 burger rating (a 9.0 from one user with a photo).

**Handling:** Bayesian smoothing pulls this toward the prior mean. If the city mean for burgers is 7.2 and C = 5:
```
bayesian = (1.0 * 9.0 + 5 * 7.2) / (1.0 + 5) = 45.0 / 6.0 = 7.5
```
Displayed as 7.5 with confidence tier "Low" (1 < C). The score will converge toward the raw average as more ratings come in.

### Edge Case 5: Skip Abuse

**Scenario:** User skips every battle, effectively inserting every new burger at the midpoint of its sentiment zone.

**Handling:** The skip limit (⌊battles/3⌋) prevents this. For a 6-battle sequence, only 2 skips are allowed. After skips are exhausted, the skip button disappears and the user must choose a winner. If the user abandons the flow entirely, the item is inserted at the midpoint of the zone (best available estimate).

### Edge Case 6: Radius-Based Queries

**Scenario:** User queries "best burger within 5 miles."

**Handling:** Compute on the fly by selecting all restaurants within the radius. Apply Bayesian smoothing with a dynamically calculated C based on the approximate restaurant density in that radius. For sparse areas (few restaurants), use a lower C. For dense areas, use a higher C.

```
C_radius = max(3, min(10, total_restaurants_in_radius / 20))
```

This prevents a rural area with 3 burger joints from requiring 10 ratings each to show meaningful scores, while a dense city center with 500 burger joints demands more evidence.

---

## 10. Implementation Priorities

1. **Rating flow:** Restaurant → dish type → sentiment → photo → tags/notes → battles → leaderboard insertion.
2. **Personal leaderboard:** Per dish type, showing rank + derived score. Bucket-anchored interpolation.
3. **Binary insertion battles:** Within sentiment zone, with skip limits.
4. **Replace-on-revisit:** UNIQUE constraint + re-battle flow.
5. **Neighborhood + state + country leaderboards.**
6. **Food recommendations** (community score + affinity boost).
7. **Radius-based queries.**
8. **Sentiment alignment** for better personalized recommendations.
9. **Dynamic C tuning** based on observed data distributions per geo area.
10. **Analytics dashboard** — battle skip rates, sentiment distributions, score distributions per geo.

---

## Appendix A: Score Derivation — Full Pseudocode

```
FUNCTION recalculate_all_scores(user_id, dish_type_id):
    leaderboard = get_leaderboard_ordered_by_rank(user_id, dish_type_id)

    liked_items = leaderboard.filter(r => r.sentiment == 'liked')
    okay_items = leaderboard.filter(r => r.sentiment == 'okay')
    disliked_items = leaderboard.filter(r => r.sentiment == 'disliked')

    assign_scores(liked_items,    ceiling=10.0, floor=7.0)
    assign_scores(okay_items,     ceiling=6.9,  floor=4.0)
    assign_scores(disliked_items, ceiling=3.9,  floor=1.0)

    bulk_update_scores(leaderboard)


FUNCTION assign_scores(items, ceiling, floor):
    n = items.length

    IF n == 0:
        RETURN

    IF n == 1:
        items[0].derived_score = round((ceiling + floor) / 2, 1)
        RETURN

    FOR i = 0 TO n-1:
        normalized = i / (n - 1)          // 0.0 for best, 1.0 for worst
        score = ceiling - normalized * (ceiling - floor)
        items[i].derived_score = round(score, 1)
```

## Appendix B: Community Score — Full Pseudocode

```
FUNCTION compute_community_score(restaurant_id, dish_type_id, geo_level, geo_id):
    ratings = get_ratings_in_geo(restaurant_id, dish_type_id, geo_level, geo_id)

    IF ratings.length == 0:
        RETURN null

    weighted_sum = 0
    weighted_count = 0

    FOR EACH r IN ratings:
        w = 1.0 IF r.has_photo ELSE 0.5
        weighted_sum += r.derived_score * w
        weighted_count += w

    raw_avg = weighted_sum / weighted_count

    C = get_prior_strength(dish_type_id, geo_level)
    m = get_global_mean(dish_type_id, geo_level, geo_id)

    bayesian = (weighted_count * raw_avg + C * m) / (weighted_count + C)

    confidence = CASE
        WHEN weighted_count < C           THEN 'low'
        WHEN weighted_count < 2 * C       THEN 'medium'
        WHEN weighted_count < 5 * C       THEN 'high'
        ELSE                                   'very_high'
    END

    RETURN {
        bayesian_score: round(bayesian, 1),
        raw_weighted_avg: round(raw_avg, 1),
        total_ratings: ratings.length,
        weighted_rating_count: round(weighted_count, 1),
        confidence_tier: confidence
    }
```

## Appendix C: Key Formulas Quick Reference

| Formula | Purpose |
|---|---|
| `score = ceiling - (rank_in_bucket - 1) / (bucket_size - 1) * (ceiling - floor)` | Personal score derivation |
| `bayesian = (Σwᵢsᵢ + C·m) / (Σwᵢ + C)` | Community leaderboard score |
| `max_battles = ⌊log₂(zone_size)⌋ + 1` | Battle count per rating |
| `max_skips = max(1, ⌊total_battles / 3⌋)` | Skip allowance |
| `wᵢ = 1.0 if photo else 0.5` | Photo credibility weight |
| `C_radius = max(3, min(10, restaurants / 20))` | Dynamic prior for radius queries |
| `affinity_boost = clamp((user_dish_avg - user_overall_avg) / 10, -0.3, 0.3)` | Dish type affinity for recommendations |