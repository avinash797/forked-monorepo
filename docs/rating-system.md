# Rating System — How It Works

This document traces the full lifecycle of a dish rating, from submission through battle resolution to leaderboard update. All logic lives in PostgreSQL functions and triggers.

---

## 1. User Signup

Before any rating can happen, a user profile must exist.

**Trigger:** `on_auth_user_created` fires `AFTER INSERT ON auth.users`.

**Function:** `handle_new_user()`
- Creates a row in `profiles` (id, username, display_name, avatar_url)
- Sets `credibility_score = 1.00` (default)
- This profile row is required by every downstream function that reads credibility

---

## 2. Submitting a Rating — `post_rating_and_get_duel`

**Called by:** The client (React Native app) directly via Supabase RPC.

**Signature:**
```
post_rating_and_get_duel(
  p_restaurant_id, p_dish_type_id, p_photo_url,
  p_raw_score, p_variation_id?, p_notes?, p_taste_tag_ids?
)
```

### Step 1 — Compute Initial Elo

The raw score (1–10) is converted to an Elo-scale number immediately:

```
initial_elo = 1000 + (raw_score × 100)
```

| raw_score | initial_elo |
|-----------|-------------|
| 1         | 1100        |
| 5         | 1500        |
| 10        | 2000        |

This seeds the rating at a meaningful position in the 1000–2000 Elo band before any battles have occurred.

### Step 2 — Insert into `personal_ratings`

```sql
INSERT INTO personal_ratings (
  user_id, restaurant_id, dish_type_id, variation_id,
  photo_url, raw_score, personal_elo, notes
)
```

**Side effects — two triggers fire on this INSERT:**

#### Trigger A: `auto_populate_restaurant_dish_on_rating`
Fires `AFTER INSERT ON personal_ratings`.
Calls `auto_populate_restaurant_dish()`.
- Upserts a row into `restaurant_dishes` for this `(restaurant_id, dish_type_id, variation_id)` combo
- On first rating: creates the record with `total_ratings = 1`
- On subsequent ratings: increments `total_ratings`
- Purpose: builds the restaurant's dish catalog automatically from user activity

#### Trigger B: `update_featured_photo_on_rating`
Fires `AFTER INSERT OR UPDATE ON personal_ratings`.
Calls `update_featured_photo()`.
- Queries `personal_ratings` for the highest `raw_score` photo for this `(restaurant_id, dish_type_id)`
- Updates `global_dish_scores.featured_photo_url` and `featured_rating_id`
- Purpose: keeps the hero photo on the leaderboard and dish detail screen current without manual curation

### Step 3 — Handle Taste Tags

If `p_taste_tag_ids` is provided:
- Deletes all existing rows from `personal_rating_tags` for this rating
- Inserts new rows into `personal_rating_tags (rating_id, tag_id)` for each tag

This is a full replace, not a merge, so re-rating resets tags cleanly.

### Step 4 — Update User Credibility

Calls `calculate_user_credibility(user_id)`.

- Counts all of the user's ratings across all dish types: `SELECT count(*) FROM personal_ratings WHERE user_id = ?`
- Applies formula: `credibility = 1.0 + (0.5 × ln(total_ratings))`
- Updates `profiles.credibility_score` and `profiles.total_ratings`
- Returns the new credibility value

**Side effect:** The `update_profiles_updated_at` trigger fires on this UPDATE, setting `profiles.updated_at = now()`.

Credibility grows logarithmically — fast early on, slowing as volume grows. It never decreases.

| total_ratings | credibility |
|---------------|-------------|
| 1             | 1.00        |
| 5             | 1.80        |
| 20            | 2.50        |
| 100           | 3.30        |

### Step 5 — Upsert Global Dish Score (Running Totals)

Upserts a row into `global_dish_scores` for this `(restaurant_id, dish_type_id)`.

**On first rating for this dish:**
```
weighted_elo_sum = initial_elo × credibility
weighted_raw_sum = raw_score × credibility
total_weight     = credibility
global_elo       = initial_elo
avg_raw_score    = raw_score
total_ratings    = 1
```

**On subsequent ratings:**
```
weighted_elo_sum += initial_elo × credibility
weighted_raw_sum += raw_score × credibility
total_weight     += credibility
global_elo        = weighted_elo_sum / total_weight
avg_raw_score     = weighted_raw_sum / total_weight
total_ratings    += 1
```

This is an O(1) operation — no scan of existing ratings required. The running totals are the source of truth; `global_elo` and `avg_raw_score` are always derived from them.

**Side effect:** The `update_global_dish_scores_updated_at` trigger fires, setting `updated_at = now()`.

### Step 6 — Find a Battle Candidate

Calls `find_comparison_candidate(user_id, dish_type_id, new_rating_id, initial_elo)`.

Searches `personal_ratings` for another rating by the same user, same dish type, that:
- Is not the new rating itself
- Has a `personal_elo` within ±400 of the new rating's initial Elo

Returns the closest match by Elo distance. Returns NULL if no candidate exists (first rating of this dish type for the user).

### Step 7 — Create Comparison Record (if candidate found)

If `find_comparison_candidate` returns a match:
- INSERTs into `comparisons`:
  - `rating_a_id` = new rating
  - `rating_b_id` = candidate
  - `rating_a_elo_before` = new rating's initial_elo
  - `rating_b_elo_before` = candidate's current personal_elo
  - `winner_rating_id` = NULL (pending)

The comparison row is the pending battle. It sits unresolved until the user votes.

### Step 8 — Return to Client

```json
// With a duel
{
  "rating_id": "<uuid>",
  "has_duel": true,
  "duel_data": {
    "comparison_id": "<uuid>",
    "opponent_rating_id": "<uuid>",
    "opponent_name": "Dooky Chase",
    "opponent_photo": "<url>",
    "opponent_score": 8.5
  }
}

// Without a duel
{
  "rating_id": "<uuid>",
  "has_duel": false
}
```

The client uses `has_duel` to decide whether to navigate to the compare screen immediately.

---

## 3. Resolving a Battle — `submit_comparison`

**Called by:** The client when the user votes (or navigates to pending comparisons via `PendingComparisonsCTA`).

**Signature:**
```
submit_comparison(p_comparison_id, p_winner_rating_id)
```

### Step 1 — Fetch and Validate Comparison

Reads the `comparisons` row. Raises an exception if `winner_rating_id` is already set — prevents double-processing.

### Step 2 — Elo Math

Uses the standard Elo expected-score formula with a fixed K-factor of 32:

```
ea = 1 / (1 + 10^((elo_b_before - elo_a_before) / 400))
eb = 1 / (1 + 10^((elo_a_before - elo_b_before) / 400))

new_elo_a = elo_a_before + 32 × (actual_score_a - ea)
new_elo_b = elo_b_before + 32 × (actual_score_b - eb)
```

Where `actual_score` is 1.0 for the winner and 0.0 for the loser.

### Step 3 — Stamp the Comparison Record

Updates `comparisons`:
- `winner_rating_id` = the chosen winner
- `rating_a_elo_after` = new_elo_a
- `rating_b_elo_after` = new_elo_b

### Step 4 — Update Personal Ratings

Two UPDATEs on `personal_ratings` (one per rating):
- `personal_elo` = new calculated Elo
- `battles_total += 1`
- `battles_won += 1` (if winner)
- `battles_lost += 1` (if loser)

**Side effects on each UPDATE:**

#### Trigger: `update_personal_ratings_updated_at`
Sets `personal_ratings.updated_at = now()`.

#### Trigger: `update_featured_photo_on_rating`
Fires again on UPDATE. Re-evaluates and potentially updates `global_dish_scores.featured_photo_url` for each affected dish. If the battle changed which rating has the highest raw score, the hero photo updates automatically.

### Step 5 — Update Global Dish Scores (×2)

Calls `update_global_dish_score(rating_id, old_elo, new_elo, won)` once for each rating.

**Function: `update_global_dish_score`**

- Looks up `(restaurant_id, dish_type_id)` and `credibility_score` for the rating's user — two point lookups, no aggregation
- Computes: `elo_delta = (new_elo - old_elo) × credibility`
- Applies to `global_dish_scores` in a single row UPDATE:

```
weighted_elo_sum += elo_delta
global_elo        = weighted_elo_sum / total_weight
total_battles    += 1
battles_won      += 1 (if won)
win_rate          = battles_won / total_battles
confidence_score  = calculate_confidence_score(total_battles, win_rate, total_ratings)
```

This is O(1) — one row read, one row write, regardless of how many total ratings exist.

Calls `calculate_confidence_score(total_battles, win_rate, total_ratings)`:
```
battle_factor = ln(total_battles + 1)
rating_factor = min(total_ratings / 10, 1.0)
confidence    = battle_factor × win_rate × (0.5 + 0.5 × rating_factor)
```

Confidence determines leaderboard eligibility. A dish needs enough battles AND a decent win rate to rank.

**Side effect:** `update_global_dish_scores_updated_at` trigger fires, setting `updated_at = now()`.

---

## 4. Reading the Leaderboard

### `get_leaderboard(city_id, dish_type_id, neighborhood_id?, limit?, min_battles?, min_ratings?)`

Reads directly from `global_dish_scores`. No computation happens here — it reads the pre-computed values maintained by the write path.

Filters:
- `city_id` matches
- `dish_type_id` matches
- `neighborhood_id` matches (if provided — neighborhood view)
- `total_battles >= min_battles` (default 5)
- `total_ratings >= min_ratings` (default 3)
- `restaurants.is_closed = false`

Orders by: `global_elo DESC`, then `win_rate DESC`, then `total_battles DESC`, then `avg_raw_score DESC`.

Returns: rank, restaurant name, neighborhood, global_elo, total_battles, win_rate, confidence_score, avg_raw_score, total_ratings, featured_photo_url.

### `get_nearby_leaderboard(dish_type_id, latitude, longitude, radius_meters?, limit?)`

Same as above but filters by PostGIS `ST_DWithin` on `restaurants.coordinates` instead of city/neighborhood. Returns `distance_meters` as an additional column.

---

## 5. Trigger & Function Reference

### Triggers

| Trigger | Table | Event | Calls |
|---------|-------|-------|-------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |
| `auto_populate_restaurant_dish_on_rating` | `personal_ratings` | AFTER INSERT | `auto_populate_restaurant_dish()` |
| `update_featured_photo_on_rating` | `personal_ratings` | AFTER INSERT OR UPDATE | `update_featured_photo()` |
| `update_personal_ratings_updated_at` | `personal_ratings` | BEFORE UPDATE | `update_updated_at()` |
| `update_profiles_updated_at` | `profiles` | BEFORE UPDATE | `update_updated_at()` |
| `update_global_dish_scores_updated_at` | `global_dish_scores` | BEFORE UPDATE | `update_updated_at()` |
| `update_restaurants_updated_at` | `restaurants` | BEFORE UPDATE | `update_updated_at()` |
| `update_restaurant_dishes_updated_at` | `restaurant_dishes` | BEFORE UPDATE | `update_updated_at()` |

### Functions Called Per Rating Submission

```
post_rating_and_get_duel
├── INSERT personal_ratings
│   ├── → auto_populate_restaurant_dish()       [trigger]
│   └── → update_featured_photo()               [trigger]
├── INSERT personal_rating_tags (if tags provided)
├── calculate_user_credibility()
│   └── UPDATE profiles
│       └── → update_updated_at()               [trigger]
├── UPSERT global_dish_scores (running totals)
│   └── → update_updated_at()                   [trigger]
└── find_comparison_candidate()
    └── INSERT comparisons (if candidate found)
```

### Functions Called Per Battle Resolution

```
submit_comparison
├── UPDATE comparisons
├── UPDATE personal_ratings (×2)
│   └── → update_featured_photo()               [trigger, ×2]
│   └── → update_updated_at()                   [trigger, ×2]
└── update_global_dish_score() (×2)
    └── calculate_confidence_score()             [×2]
    └── UPDATE global_dish_scores (×2)
        └── → update_updated_at()               [trigger, ×2]
```

---

## 6. Key Design Decisions

**`global_elo` is not `avg_raw_score`.** They are independent. `avg_raw_score` is what users typed. `global_elo` is the result of battle outcomes weighted by credibility. The two can and do diverge — a dish can rank #1 by Elo despite a lower avg_raw_score if it consistently beats other high-scoring dishes in head-to-head comparisons.

**Leaderboard updates are synchronous.** Every vote immediately updates `global_dish_scores`. There is no batch job or replication lag — the leaderboard reflects the latest vote the moment it is cast.

**Running totals, not re-aggregation.** `global_dish_scores` stores `weighted_elo_sum`, `weighted_raw_sum`, and `total_weight` as running totals. Any update is O(1). The prior approach re-aggregated all ratings for a dish on every single battle, making the most popular dishes the most expensive to update.

**Credibility is global, not per dish type.** A user's credibility score applies equally to all their ratings across all dish types. It grows with volume (logarithmically) and never decreases.

**Pending comparisons are persistent.** A comparison row with `winner_rating_id = NULL` is a pending battle. The `PendingComparisonsCTA` component surfaces these to the user. They can be resolved in any session after the original rating was submitted — there is no expiry.
