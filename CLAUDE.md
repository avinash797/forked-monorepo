# CLAUDE.md

## What This Is

Expo React Native dish-ranking app (SDK 54, Router v6, TypeScript strict, New Architecture). Single city (New Orleans) at launch. Users rank dishes via **sentiment + binary insertion sort** — never numeric input.

> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

## Commands

```bash
npx expo start       # Dev server
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run lint         # ESLint
```

No test suite configured.

## Rating System — The Core Mental Model

**EAT → SNAP → COMPARE → RANK**

1. User submits: mandatory photo + sentiment (liked / okay / disliked) + optional taste tags
2. System runs binary insertion sort battles **within that sentiment zone** for same dish type
3. Score derived from rank position — user never inputs a number

### Score Boundaries (Hard Rules)

| Sentiment | Floor | Ceiling |
|-----------|-------|---------|
| Liked     | 7.0   | 10.0    |
| Okay      | 4.0   | 6.9     |
| Disliked  | 1.0   | 3.9     |

Formula: `score = ceiling − ((rank−1)/(n−1)) × (ceiling−floor)`. Single item = midpoint.

### Community Scores

```
bayesian = (Σsᵢ + C·m) / (n + C)
C = 5 (flat for v0.1), m = global mean for dish type in city
```

Confidence tiers: `low` (<5 ratings) / `medium` (5–9) / `high` (10–24) / `very_high` (≥25)

### Battle Flow

```
Submit → sentiment zone has 0 items → no battle, place at #1, score = midpoint
Submit → sentiment zone has N items → binary insertion sort, max ⌊log₂(N)⌋+1 battles
Each battle: "Which [Dish Type] wins?" → user taps winner or skips (limited)
Done → rank inserted → all derived_scores recalculated → community score updated
```

## Hard Rules

- NEVER use star symbols (★) or the word "star" for ratings
- NEVER ask users to input a numeric score
- NEVER use `useState`/`useEffect` for server data — always React Query
- Photo is **mandatory** for every rating (`photo_url NOT NULL`)
- Battles are **strictly isolated by dish_type** (gumbo vs gumbo only)
- Battles occur **within the sentiment zone only**
- Re-rating same dish replaces old entry, resets rank, triggers fresh battles
- Taste tags are selected on the rating screen (before battles), not after
- Only invalidate leaderboard/discover queries when battle sequence completes (`done === true`)

## Architecture Quick Reference

### State Management

| Type | Tool | Examples |
|------|------|---------|
| Server | React Query | All Supabase data, mutations |
| Client | Zustand | Rating flow, auth, location, UI |
| Component | useState | Local form state |
| Theme | Context API | Theme tokens, Supabase client |

### Key Stores (Zustand)

- `useRatingStore`: photo, restaurant, dish type, **sentiment**, battleState, tags, location
- `useLocationFilterStore`: city/neighborhood/nearby toggle
- `useAuthStore` + `useAuth()` hook: auth state + session management

### Supabase RPCs (Current)

- `create_rating` → returns `{rating_id, has_battle, battle_id, opponent, max_steps, ...}`
- `process_battle` → returns `{done, next_battle_id, rank_position, derived_score, ...}`
- `skip_battle` → same return shape as process_battle
- `recalculate_derived_scores` → internal helper, recalcs all scores for user+dish_type
- `compute_community_score` → Bayesian smoothing for global_dish_scores
- `get_leaderboard` / `get_nearby_leaderboard` → ORDER BY `bayesian_score DESC`
- `get_my_best_ever` → ORDER BY `derived_score DESC`
- `get_user_stats`, `get_discover_heroes`, `get_discover_rising_stars`, `match_location`

### Database Schema (Key Columns)

- `personal_ratings`: sentiment, derived_score, rank_position, photo_url, notes. **No raw_score, no personal_elo.**
- `comparisons`: new_rating_id, opponent_rating_id, result ('new_wins'/'opponent_wins'/'skipped'), step_number, low_bound, high_bound. **No rating_a_id/rating_b_id, no winner_rating_id, no elo columns.**
- `global_dish_scores`: bayesian_score, confidence_tier, raw_weighted_avg, weighted_rating_count. **No global_elo, no win_rate, no confidence_score.**

### Key Hooks

- `useCreateRating`, `useProcessBattle`, `useSkipBattle` — core rating flow
- `useMyDishRankings`, `usePersonalRating`, `useMyBestEver` — personal data
- `useLeaderboard`, `useDiscoverData`, `useRisingStars`, `useRecentBattles` — discovery
- `useRestaurants`, `useNearbyRestaurants`, `useDishTypes`, `useTasteTags` — reference data
- `useUserStats`, `useProfile`, `useUserBadges` — profile

### Rating Flow (Screen Order)

1. `(rating)/index.tsx` — photo capture (mandatory)
2. `venue-search.tsx` — pick restaurant (GPS sorted)
3. `dish-selection.tsx` — pick dish type (5 pre-defined)
4. `rating.tsx` — sentiment + photo upload + taste tags → `create_rating` RPC
5. `compare.tsx` — binary insertion battles (if zone non-empty) → `process_battle` RPC

Battle opponent data flows via `useRatingStore().battleState` (Zustand), not URL params.

## Development Patterns

- `Pressable` over `TouchableOpacity`
- `FlatList` over `ScrollView` for lists
- Bottom sheets over modals
- `_layout.tsx` = navigation only, no business logic
- Always use theme tokens (`theme.color.*`, `theme.space.*`, `theme.font.*`)
- Import alias: `@/*` maps to project root
- PostGIS for all geospatial queries
- `score-badge.tsx`: green ≥7.0 / yellow 4.0–6.9 / red <4.0
