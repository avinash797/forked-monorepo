# Badge System Implementation Plan

## Overview

A dynamic, server-driven badge/achievement system. Badge definitions live in the database (not hardcoded), so new badges can be added, retired, or featured without app updates. Badges are evaluated and awarded server-side via Supabase RPCs, triggered after ratings and battles complete.

---

## Phase 1: Database Schema

### New Tables

**`badge_definitions`** — The catalog of all possible badges.

```sql
CREATE TABLE public.badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,           -- 'gumbo_guru', 'first_bite', etc.
    name TEXT NOT NULL,                   -- 'Gumbo Guru'
    description TEXT NOT NULL,            -- 'Rate 10 gumbos'
    image_url TEXT NOT NULL,              -- Supabase Storage URL, e.g. https://<project>.supabase.co/storage/v1/object/public/badges/first_bite.png
    category TEXT NOT NULL DEFAULT 'milestone',  -- 'milestone' | 'dish_type' | 'explorer' | 'battle' | 'special'
    dish_type_id UUID REFERENCES dish_types(id), -- NULL for non-dish badges
    threshold INTEGER,                    -- e.g. 10 for "rate 10 dishes"
    rule_type TEXT NOT NULL,              -- 'total_ratings' | 'dish_type_count' | 'total_comparisons' | 'cities_count' | 'dish_types_count' | 'manual'
    is_active BOOLEAN DEFAULT true,       -- false = retired (no new awards, existing awards kept)
    is_featured BOOLEAN DEFAULT false,    -- admin-curated highlight
    sort_order INTEGER DEFAULT 0,         -- display ordering
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**`user_badges`** — Junction table: which users have earned which badges.

```sql
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    notified BOOLEAN DEFAULT false,       -- for future async notification support
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges(badge_id);
```

### Supabase Storage

- Create a public bucket: `badges`
- Upload one image per badge slug (e.g. `badges/first_bite.png`, `badges/gumbo_guru.png`)
- The `image_url` column stores the full public URL
- Bucket policy: public read, no direct upload from clients (admin only)

### RLS Policies

- `badge_definitions`: public read for all authenticated users
- `user_badges`: users can read their own rows; insert/update only via RPCs (SECURITY DEFINER)

### Seed Data — Initial Badge Definitions

| slug              | name                       | category  | rule_type         | threshold | dish_type_id   |
| ----------------- | -------------------------- | --------- | ----------------- | --------- | -------------- |
| `first_bite`      | First Bite                 | milestone | total_ratings     | 1         | NULL           |
| `getting_started` | Getting Started            | milestone | total_ratings     | 10        | NULL           |
| `foodie`          | Foodie                     | milestone | total_ratings     | 50        | NULL           |
| `connoisseur`     | Connoisseur                | milestone | total_ratings     | 100       | NULL           |
| `battle_tested`   | Battle Tested              | battle    | total_comparisons | 25        | NULL           |
| `battle_master`   | Battle Master              | battle    | total_comparisons | 100       | NULL           |
| `explorer`        | Explorer                   | explorer  | cities_count      | 3         | NULL           | `is_active=false` (single-city launch; activate when multi-city ships) |
| `diverse_palate`  | Diverse Palate             | explorer  | dish_types_count  | 5         | NULL           |
| `gumbo_guru`      | Gumbo Guru                 | dish_type | dish_type_count   | 10        | {gumbo_id}     |
| `poboy_pro`       | Po'Boy Pro                 | dish_type | dish_type_count   | 10        | {poboy_id}     |
| ...               | (one per active dish type) | dish_type | dish_type_count   | 10        | {dish_type_id} |

Dish-type badges will be seeded dynamically from existing `dish_types` rows.

---

## Phase 2: Server-Side RPCs

### `evaluate_badges(p_user_id UUID)` — Core evaluation function

**Returns:** `JSONB[]` — array of newly awarded badges (badges earned in this call).

**Logic:**

1. Query all active `badge_definitions`
2. For each, check if the user already has it in `user_badges` — skip if yes
3. Evaluate the `rule_type` against user stats:
    - `total_ratings` → count from `personal_ratings WHERE user_id = p_user_id`
    - `dish_type_count` → count from `personal_ratings WHERE user_id = p_user_id AND dish_type_id = badge.dish_type_id`
    - `total_comparisons` → count from `comparisons` involving user's ratings
    - `cities_count` → count distinct cities from user's ratings
    - `dish_types_count` → count distinct dish_type_id from user's ratings
    - `manual` → skip (admin-only awards)
4. If threshold met → INSERT into `user_badges`
5. Return array of newly inserted badges (id, slug, name, description, image_url)

This function is called in two places:
- **`create_rating`**: when `battle_id IS NULL` (no-battle path — sentiment zone was empty, no comparisons needed)
- **`submit_comparison`**: when `battle_complete = true` (battle finished via process or skip)

### `get_user_badges(p_user_id UUID)` — Fetch user's badge collection

**Returns:** All badge definitions with an `earned_at` field (NULL if not earned).

```sql
SELECT bd.*, ub.earned_at, ub.notified
FROM badge_definitions bd
LEFT JOIN user_badges ub ON ub.badge_id = bd.id AND ub.user_id = p_user_id
WHERE bd.is_active = true OR ub.id IS NOT NULL  -- show active + any earned (even retired)
ORDER BY bd.is_featured DESC, bd.sort_order, bd.created_at;
```

### `award_badge_manual(p_user_id UUID, p_badge_slug TEXT)` — Admin manual award

For special/event badges. Protected by admin check.

### Modify existing RPC

- **`submit_comparison`**: When `battle_complete = true`, call `evaluate_badges(auth.uid())` and include `new_badges` in the response.

---

## Phase 3: TypeScript Types

### `types/badge.types.ts`

```typescript
export interface BadgeDefinition {
    id: string;
    slug: string;
    name: string;
    description: string;
    image_url: string;           // Supabase Storage URL
    category: 'milestone' | 'dish_type' | 'explorer' | 'battle' | 'special';
    dish_type_id: string | null;
    threshold: number | null;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
}

export interface UserBadge extends BadgeDefinition {
    earned_at: string | null; // null = not yet earned
    notified: boolean;
}

export interface NewBadgeAward {
    id: string;
    slug: string;
    name: string;
    description: string;
    image_url: string;           // Supabase Storage URL
}
```

Update `CreateRatingResponse` and `SubmitComparisonResponse` to include:

```typescript
new_badges?: NewBadgeAward[];
```

---

## Phase 4: Frontend — Hooks

### `hooks/use-badges.ts` (new file)

```typescript
// useUserBadges(userId) — replaces the existing client-side hook
//   queryKey: ['userBadges', userId]
//   calls get_user_badges RPC
//   returns UserBadge[]

// useBadgeDefinitions() — for admin/display purposes
//   queryKey: ['badgeDefinitions']
//   fetches all active badge definitions
```

### Modify existing hooks

- **`use-ratings.ts` (`useCreateRating`)**:
    - `onSuccess`: if `data.new_badges?.length > 0`, show badge celebration modal, then invalidate `['userBadges']`

- **`use-comparisons.ts` (`useProcessBattle`, `useSkipBattle`)**:
    - `onSuccess`: if `data.battle_complete && data.new_badges?.length > 0`, show badge celebration modal, then invalidate `['userBadges']`

### Remove old `useUserBadges` from `use-user-stats.ts`

Replace with re-export from `use-badges.ts` for backward compat.

---

## Phase 5: Frontend — Badge Celebration Modal

### `components/badges/badge-celebration-modal.tsx` (new)

A translucent overlay modal (not a bottom sheet — badge awards are a celebratory interrupt, not a navigation action) that displays when a badge is earned:

- Badge image (`image_url`) rendered large, animated with a scale/bounce effect; falls back to a generic placeholder asset if the URL fails to load
- Badge name + description
- Congratulatory message (e.g., "Achievement Unlocked!")
- "Awesome" dismiss button
- If multiple badges earned at once, show them in sequence or as a carousel

### Zustand store addition: `stores/use-badge-store.ts` (new)

```typescript
interface BadgeStore {
    pendingBadges: NewBadgeAward[]; // queue of badges to celebrate
    showNext: () => void; // pop and display next
    addBadges: (badges: NewBadgeAward[]) => void;
    currentBadge: NewBadgeAward | null;
    dismiss: () => void;
}
```

This allows queueing multiple badge awards and showing them one by one.

---

## Phase 6: Frontend — Updated Badge Display

### Update `components/profile/badges-section.tsx`

- Use new `useUserBadges()` hook (DB-backed)
- Show earned badges prominently, with featured badges highlighted (e.g., gold border or glow)
- Show a "See All" link if there are many badges
- Unearned badges shown as locked/greyed out (optional — could be a future enhancement)

### Update `components/profile/badges-section.tsx` layout

- Featured badges get a special border/highlight treatment
- Badge count shows "X of Y earned"

---

## Phase 7: Cache Invalidation Strategy

| Event                                | Invalidate                               |
| ------------------------------------ | ---------------------------------------- |
| Rating created (with/without battle) | `['userBadges']` if `new_badges` present |
| Battle completed                     | `['userBadges']` if `new_badges` present |
| Manual badge award (admin)           | `['userBadges', userId]`                 |

---

## Implementation Order

1. **Supabase Storage** — Create public `badges` bucket, upload initial badge images, copy URLs for seed data
2. **Database migration** — Create tables, seed badge definitions (with `image_url`s), add RLS
2. **`evaluate_badges` RPC** — Core evaluation logic
3. **`get_user_badges` RPC** — Fetch with earned status
4. **Modify `create_rating` and `submit_comparison`** — Call evaluate + return new badges
5. **Update `database.types.ts`** — Regenerate or manually add new tables
6. **TypeScript types** — `badge.types.ts`, update RPC response types
7. **`use-badges.ts` hook** — Replace client-side computation
8. **Badge store** — Zustand store for celebration queue
9. **Badge celebration modal** — UI component
10. **Wire up mutations** — Show modal on new badges
11. **Update `BadgesSection`** — Use new data shape, featured highlighting

---

## Key Design Decisions

- **Server-side evaluation**: Badges can't be faked client-side. All logic lives in `evaluate_badges` RPC.
- **`rule_type` + `threshold` pattern**: Adding a new badge = inserting a row in `badge_definitions`. No code changes needed for standard rule types.
- **Custom rule types**: For truly novel badges, add a new `rule_type` case to `evaluate_badges`. This is a single SQL function change.
- **Retirement**: Set `is_active = false`. Existing awards preserved. Badge stops appearing for unearnables but stays for those who have it.
- **Featured**: Admin sets `is_featured = true`. Frontend sorts featured first and applies visual treatment.
- **Future notification support**: `notified` column on `user_badges` is ready for async push notifications later.
- **No app update needed for new badges**: Badge definitions come from DB. New badges appear automatically as long as they use existing `rule_type` values.
- **Images via Supabase Storage**: Badge images are hosted in the public `badges` bucket. New badge images can be uploaded and linked without an app update. A local fallback placeholder asset handles load failures.
