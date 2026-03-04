# CLAUDE.md

## What This Is

Expo React Native dish-ranking app (SDK 54, Router v6, TypeScript strict, New Architecture). Single city (New Orleans) at launch. Users rank dishes via **sentiment + Elo hybrid (binary search for UX, Elo for scoring)** — never numeric input.

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
2. System runs binary search battles **within that sentiment zone** for same dish type
3. Each comparison updates Elo scores for both dishes — user never inputs a number

### Scoring (Hybrid Elo)

Binary search collects pairwise comparisons; Elo math computes scores from those comparisons.

- Initial Elo set by sentiment: liked=1800, okay=1500, disliked=1200
- Each comparison: `new_elo = old_elo + K * (outcome - expected)`, K decays with comparison_count
- Display score: `(elo - 1000) / 1000 * 10`, Elo clamped per sentiment zone
- Global Elo clamp: 1000-2000

### Score Boundaries (Hard Rules)

| Sentiment | Floor | Ceiling | Elo Range   |
|-----------|-------|---------|-------------|
| Liked     | 7.0   | 10.0    | 1700-2000   |
| Okay      | 4.0   | 6.9     | 1400-1690   |
| Disliked  | 1.0   | 3.9     | 1100-1390   |

### Community Scores

```
bayesian = (Σ(sᵢ·wᵢ) + C·m) / (Σwᵢ + C)
C = 5, m = global mean for dish type in city, wᵢ = user credibility (0-1)
Credibility = log(1 + total_ratings) / log(1 + 500), capped at 1.0
```

Confidence tiers (by raw rating count): `low` (<5) / `medium` (5-9) / `high` (10-24) / `very_high` (>=25)

### Battle Flow

```
Submit → sentiment zone has 0 candidates → no battle, score = initial Elo
Submit → sentiment zone has N candidates → binary search, max ⌊log₂(N)⌋+1 comparisons
Each comparison: "Which [Dish Type] wins?" → user taps winner or skips (ends battle)
Each tap → Elo updated for both dishes immediately
Done → battle completed → community scores updated for all affected restaurants
```

## Hard Rules

- NEVER use star symbols (★) or the word "star" for ratings
- NEVER ask users to input a numeric score
- NEVER use `useState`/`useEffect` for server data — always React Query
- Photo is **mandatory** for every rating (`photo_url NOT NULL`)
- Battles are **strictly isolated by dish_type** (gumbo vs gumbo only)
- Battles occur **within the sentiment zone only**
- Re-rating same dish replaces old entry, resets Elo to initial sentiment value, triggers fresh battles
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

- `create_rating` → returns `{rating_id, battle_id, opponent, battle_complete, elo_score, ...}`
- `submit_comparison` → returns `{battle_complete, rating_id, final_elo | current_elo, opponent, ...}`
- `_update_profile_stats` → internal helper, updates credibility + stats
- `_update_global_dish_score` → internal helper, Bayesian leaderboard recalc
- `get_leaderboard` / `get_nearby_leaderboard` → ORDER BY `bayesian_score DESC`
- `get_my_best_ever` → ORDER BY `derived_score DESC`
- `get_personal_rankings` → user's ranked list by Elo for a dish type
- `get_user_stats`, `get_discover_heroes`, `get_discover_rising_stars`, `match_location`

### Database Schema (Key Columns)

- `personal_ratings`: sentiment, elo_score, derived_score (generated from Elo), comparison_count, battle_status, photo_url, notes. **No rank_position, no raw_score.**
- `comparisons`: new_rating_id, opponent_rating_id, result ('new_wins'/'opponent_wins'/'skipped'), step_number, Elo snapshots (new/opponent before/after), k_factors.
- `battle_sessions`: rating_id, candidate_ids (UUID[]), low_idx/high_idx (binary search state), status.
- `global_dish_scores`: bayesian_score, confidence_tier, raw_weighted_avg, weighted_rating_count. **No global_elo, no win_rate, no confidence_score.**

### Key Hooks

- `useCreateRating`, `useSubmitComparison` — core rating flow
- `useMyDishRankings`, `usePersonalRating`, `useMyBestEver` — personal data
- `useLeaderboard`, `useDiscoverData`, `useRisingStars`, `useRecentBattles` — discovery
- `useRestaurants`, `useNearbyRestaurants`, `useDishTypes`, `useTasteTags` — reference data
- `useUserStats`, `useProfile`, `useUserBadges` — profile

### Rating Flow (Screen Order)

1. `(rating)/index.tsx` — photo capture (mandatory)
2. `venue-search.tsx` — pick restaurant (GPS sorted)
3. `dish-selection.tsx` — pick dish type (5 pre-defined)
4. `rating.tsx` — sentiment + photo upload + taste tags → `create_rating` RPC
5. `compare.tsx` — binary search battles (if zone non-empty) → `submit_comparison` RPC

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
