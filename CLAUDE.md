# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo React Native application using:

- **Expo SDK 54** with React Native 0.81.5
- **React 19.1.0** (latest stable)
- **Expo Router v6** for file-based navigation
- **TypeScript** with strict mode enabled
- **React Native New Architecture** (enabled via `newArchEnabled: true`)
- **React Native Reanimated** for smooth 60fps animations
- **Expo Linear Gradient** for visual polish
- **Expo Image** for optimized image loading
- **Experimental features**: Typed routes and React Compiler

### Product Philosophy

> "In under 30 seconds, tell me the best specific dish near me that people like me actually love."

**Core Loop:** EAT → SNAP → COMPARE → RANK

This app is an **Elo-based dish battle comparison app** focused on a single city (New Orleans) at launch. Instead of traditional star ratings or reviews, users rate dishes with a 1-10 raw score, then the system triggers head-to-head "This vs That" comparisons within the same dish type. These battles generate cleaner ranking data than absolute ratings by eliminating rating inflation.

**Key Constraints:**
- **5 dish types only at launch**: Gumbo, Po'boy, Fried Chicken, Muffuletta, Crawfish Étouffée
- **NOLA-first**: Single city with 10 neighborhoods, not global
- **Photo mandatory**: No photo = no submission. EXIF/GPS verification required.
- **No long-form reviews**: Just photo + score + optional taste tags
- **No comments, no social feed, no following** — cut from MVP

### Rating & Ranking System

**IMPORTANT:** This app uses a **category-gated Elo comparison system**, NOT a simple star or numeric rating display.

#### How It Works

1. **User rates a dish** with a raw score (INTEGER 1-10) + mandatory photo
2. **System checks user history** for the same `dish_type`
3. **If first of that type**: Score becomes the "anchor" — no comparison triggered
4. **If user has history**: System finds the closest-scored dish of the same type and triggers a "This vs That" duel
5. **Elo adjustment**: Winner's score is validated/nudged upward, loser's adjusted downward
6. **Leaderboard update**: Global rankings recalculated using credibility-weighted averages

#### Key Formulas

- **Win Probability**: `E = 1 / (1 + 10^((S_old - S_new) / 2))` (divisor of 2 for 1-10 scale)
- **Score Adjustment**: `S_adjusted = S_input + K * (W - E)` where K=0.5
- **Credibility Score** (global, across all categories): `C_u = λ * log(1 + N_total)` where λ=2.5
- **Category-Specific Global Rank**: `R = Σ(S_final_i × C_u_i) / Σ(C_u_i)` — weighted average across all users

#### Rules

- Comparisons are **strictly isolated by dish_type** (burger vs burger only, never burger vs pizza)
- Minimum **5 battles** required to appear on leaderboard
- **Confidence Score**: `log(total_battles) × win_rate` — determines leaderboard eligibility
- Database stores `personal_elo` per rating (DECIMAL 7,2, default 1500.00)
- Database stores `raw_score` as INTEGER 1-10
- `global_dish_scores` table holds pre-computed leaderboard data with `global_elo`, `confidence_score`, `win_rate`
- NEVER use star symbols (★) or star-based visualization
- NEVER use the word "star" when referring to ratings

#### Edge Cases

- **Category inflation**: Users who only rate one dish type may have inflated scores within that silo
- **Taxonomy mismatch**: "Patty Melt" vs "Burger" — dish_types use `aliases` array for resolution

### Geographic Scope

- **Launch city**: New Orleans (single city, hard-coded)
- **10 neighborhoods**: Tremé, Marigny, French Quarter, Garden District, etc.
- **Three leaderboard views**: City | Near Me (2 miles) | Neighborhood
- **PostGIS** for geospatial queries (`extensions.GEOGRAPHY(POINT, 4326)`)
- Expansion rule: Add 2 new dish types after 500+ comparisons in existing types

## Development Commands

### Starting the Development Server

```bash
npx expo start           # Start with interactive menu
npm run android          # Start and open Android emulator
npm run ios              # Start and open iOS simulator
npm run web              # Start web version
```

### Code Quality

```bash
npm run lint             # Run ESLint using expo lint
```

### Project Management

```bash
npm run reset-project    # Move starter code to app-example/, create blank app/
```

## Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router's file-based routing system located in the `app/` directory:

- **`app/_layout.tsx`**: Root layout with Stack navigation and theme provider
    - Wraps the entire app with `ThemeProvider` (React Navigation)
    - Defines `unstable_settings.anchor = '(tabs)'` for initial route
    - Includes modal screen configuration

- **`app/(auth)/`**: Authentication flow
    - `_layout.tsx`: Auth layout
    - `index.tsx`: Auth landing
    - `login.tsx`: Login screen
    - `signup.tsx`: Signup screen
    - `reset-password.tsx`: Password reset

- **`app/(protected)/`**: Protected routes requiring authentication
    - **`(tabs)/`**: Tab navigation group
        - `_layout.tsx`: Tab bar configuration with HapticTab and CenterTabButton
        - `index.tsx`: Home/Discover screen — dish type pills, hero card for #1 dish, FAB camera button
        - `add-review.tsx`: Entry point for rating flow (redirects to rating screens)
        - `leaderboard.tsx`: Dish leaderboard with city/neighborhood/nearby toggle
        - `personal.tsx`: Personal rankings and best-ever dishes
        - **`profile/`**: Nested profile screens
            - `_layout.tsx`: Profile stack navigation
            - `index.tsx`: User profile with Best Ever cards, stats row, achievement badges
            - `edit.tsx`: Edit profile screen
            - `settings.tsx`: User settings

    - **`(rating)/`**: Dish rating and comparison workflow
        - `_layout.tsx`: Stack navigation for rating flow with modal presentation
        - `index.tsx`: Photo capture/selection screen (entry point, photo is MANDATORY)
        - `venue-search.tsx`: Search and select restaurant with GPS proximity sorting
        - `create-venue.tsx`: Add new restaurant modal (if not found)
        - `dish-selection.tsx`: Select dish type for rating
        - `rating.tsx`: Rate dish with 1-10 raw score, photo upload, optional taste tags
        - `compare.tsx`: "This vs That" battle screen — full-screen split comparison

    - **`(browse)/`**: Browse and search functionality
        - `_layout.tsx`: Stack navigation for browse screens
        - `search.tsx`: Search dishes and restaurants with grouped results
        - `dish-detail.tsx`: View dish details — hero photo, ranking badge, confidence meter, taste tags, map
        - `venue-detail.tsx`: View restaurant details, all dishes, and ratings

### Theme System

The app implements a comprehensive light/dark theme system, and follows token based design system.

- **`lib/theme/token.default.ts`**: Defines Colors and Fonts for both light and dark modes
    - **`context/theme-context.tsx`**: Theme context provider for consuming theme colors with prop overrides that returns the following properties:
      {/** The active theme object with all tokens \*/
      theme: ActiveTheme;
      /** The current theme name (default, genZ, foodies, critics) _/
      themeName: ThemeName;
      /\*\* The current color scheme (light or dark) _/
      colorScheme: ThemeMode;
      /** Change the theme variant \*/
      setThemeName: (name: ThemeName) => void;
      /** Check if the theme is currently using dark mode \*/
      isDark: boolean;
      }

### Themed Components

Reusable components that automatically adapt to light/dark mode:

- **`ThemedText`** (`components/themed-text.tsx`): Typed text variants (default, title, subtitle, link, defaultSemiBold)
- **`ThemedView`** (`components/themed-view.tsx`): View with automatic background color
- **`ThemedButton`** (`components/themed-button.tsx`): Button with automatic background color
- **`ThemedTextInput`** (`components/themed-text-input.tsx`): Text input with automatic background color
- **`ThemedSelect`** (`components/themed-select.tsx`): Select/picker with automatic background color

These accept `lightColor` and `darkColor` props to override theme defaults.

### Component Organization

- **`components/`**: Shared UI components
    - `external-link.tsx`: Link component for opening URLs
    - `haptic-tab.tsx`: Tab button with haptic feedback
    - `center-tab-button.tsx`: Center tab button (FAB-style for rating entry)
    - `themed-text.tsx`: Themed text component with variants
    - `themed-view.tsx`: Themed view with background color
    - `themed-button.tsx`: Themed button component
    - `themed-text-input.tsx`: Themed text input component
    - `themed-select.tsx`: Themed select/picker component
    - `address-autocomplete.tsx`: Address autocomplete for restaurant creation
    - `fork-logo.tsx`: App logo component
    - `forked-branding-header.tsx`: Branding header component
    - `score-badge.tsx`: Color-coded rating badge (green ≥7.0, yellow 4.0-6.9, red <4.0) with gradient
    - `trend-indicator.tsx`: Trend direction indicator (rising/falling/stable)
    - **`discover/`**: Discover/home screen components
        - `confidence-meter.tsx`: Visual confidence score meter
        - `dish-type-pills.tsx`: Horizontal dish type selector (5 pills)
        - `hero-card.tsx`: Hero card showing #1 dish for selected type
        - `leaderboard-row.tsx`: Single row in leaderboard list
        - `pending-comparisons-cta.tsx`: CTA prompting user to complete pending battles
        - `recent-battle-ticker.tsx`: Live ticker of recent community battles
        - `rising-star-card.tsx`: Card for high-rated, low-battle-count discoveries
    - **`rating/`**: Rating flow components
        - `photo-picker.tsx`: Photo capture/selection with preview and delete
        - `rating-input.tsx`: Numeric rating input (1-10 scale)
        - `dish-card.tsx`: Display dish information in lists
        - `venue-card.tsx`: Display restaurant information with distance
        - `search-input.tsx`: Reusable search input component
        - `location-status-banner.tsx`: GPS verification status display
    - **`browse/`**: Browse and discovery components
        - `dish-card-with-rating.tsx`: Photo-dominant card with gradient overlay and ScoreBadge
        - `empty-state.tsx`: Empty state component for no data scenarios
        - `leaderboard-item.tsx`: Leaderboard list item with rank, confidence, medal
        - `location-bottom-sheet.tsx`: Bottom sheet for location filter selection
        - `location-header.tsx`: Location display header with filter toggle
        - `photo-gallery.tsx`: Grid-based photo gallery with modal viewer
        - `review-card.tsx`: Display rating with ScoreBadge, photos, and user info
        - `search-dish-card.tsx`: Dish card for search results
        - `section-header.tsx`: Consistent section titles with optional subtitle
    - **`profile/`**: Profile screen components
        - `achievements-tab.tsx`: Achievement badges display
        - `activities-tab.tsx`: User activity feed
        - `badges-section.tsx`: Badge grid display
        - `best-ever-card.tsx`: Personal best dish card (shareable)
        - `best-ever-section.tsx`: Horizontal scrolling Best Ever cards
        - `profile-tabs.tsx`: Tab switcher for profile sections
        - `reviews-tab.tsx`: User's ratings history
        - `stats-row.tsx`: Stats display (X dishes · X cities · X battles)
    - **`ui/`**: UI primitives
        - `badge.tsx`: Generic badge component
        - `charm.tsx`: Charm/achievement icon display
        - `collapsible.tsx`: Collapsible section component
        - `dish-type-pill.tsx`: Individual dish type pill button
        - `icon-symbol.tsx`: Expo Material icon component
        - `map-card.tsx`: Map preview card with directions CTA
        - `slider.tsx`: Slider input component

- **`hooks/`**: Custom React hooks using **@tanstack/react-query** for data fetching and mutations
    - **All network data manipulating hooks use React Query** (`useQuery`, `useMutation`, `useInfiniteQuery`) for data management
    - **`use-auth.ts`**: Authentication hook with React Query (no provider needed)
    - Rating & comparison hooks:
        - `use-ratings.ts`: Create/update ratings, fetch personal rankings, taste tags (uses `useMutation`, `useQuery`)
        - `use-comparisons.ts`: Pending comparisons, process battle results, skip tracking (uses `useQuery`, `useMutation`)
        - `use-photo-upload.ts`: Photo upload to Supabase Storage (uses `useMutation`)
        - `use-location.ts`: GPS location services with permission handling (uses `useQuery`)
    - Restaurant & dish type hooks:
        - `use-restaurants.ts`: Search restaurants, nearby restaurants, create restaurant (uses `useQuery`, `useMutation`)
        - `use-dish-types.ts`: Fetch active dish types ordered by launch_order (uses `useQuery`, 1-hour cache)
        - `use-dishes.ts`: Dish retrieval and creation (uses `useQuery`, `useMutation`)
    - Discovery & leaderboard hooks:
        - `use-discover-data.ts`: Batch fetch discover screen data — dish types, heroes, rising stars with location filtering (uses `useQuery`)
        - `use-leaderboard.ts`: Fetch leaderboard data by dish type and location (uses `useQuery`)
        - `use-trending-dishes.ts`: Trending dishes with trend score via PostgreSQL function (uses `useInfiniteQuery`)
        - `use-rising-stars.ts`: High-rated, low-battle-count discoveries (uses `useQuery`)
        - `use-recent-battles.ts`: Live community battle feed, refetches every 30s (uses `useQuery`)
        - `use-top-dishes.ts`: Fetch top-rated dishes with pagination (uses `useInfiniteQuery`)
    - Browse hooks:
        - `use-search.ts`: Search dishes and restaurants (uses `useQuery` with debouncing)
        - `use-dish-detail.ts`: Fetch dish details (uses `useQuery`)
        - `use-venue-detail.ts`: Fetch restaurant details with dishes (uses `useQuery`)
        - `use-dish-rating-history.ts`: Daily rating snapshots for charts (uses `useQuery`)
    - Profile & user hooks:
        - `use-user-stats.ts`: User stats, best-ever dishes, profile, badges, leaderboard position (uses `useQuery`)
        - `use-charms.ts`: Fetch user's unlocked charms/achievements (uses `useQuery`)
    - Utility hooks:
        - `use-address-search.ts`: Mapbox address search with debouncing (uses `useQuery`)
        - `use-reviews.ts`: Review submission (uses `useMutation`)
        - `use-venues.ts`: Legacy venue search (uses `useQuery`)

- **`contexts/`**: React contexts
    - `theme-context.tsx`: Theme provider with color scheme and theme tokens
    - `supabase-provider.tsx`: Supabase client provider

- **`stores/`**: Zustand global state management
    - `use-rating-store.ts`: Rating flow state (photo, restaurant, dish type, score, tags, location)
    - `auth.store.ts`: Authentication state (user, session, profile)
    - `location.store.ts`: Current GPS location with city/neighborhood matching via RPC
    - `use-location-filter-store.ts`: Location filter state (city/neighborhood/nearby toggle)
    - `use-ui-store.ts`: Global UI state (toasts, bottom sheets, loading)
    - `use-preferences-store.ts`: Persisted user preferences (AsyncStorage)
    - `middleware.ts`: Custom Zustand middleware (persistence, logging)
    - `index.ts`: Store exports

- **`types/`**: TypeScript type definitions
    - `auth.ts`: Authentication types
    - `browse.ts`: Browse/discovery types (TrendingDish, LeaderboardItem, SearchResult, etc.)
    - `database.ts`: Auto-generated Supabase database types
    - `database.types.ts`: Additional database type exports
    - `dishType.ts`: DishType and GlobalDishScore types
    - `rating.ts`: Rating flow types (PersonalRating, Comparison, etc.)
    - `restaurant.ts`: Restaurant type
    - `taste_tags.ts`: TasteTag type

- **`constants/`**: Centralized theme configuration

- **`assets/images/`**: App icons, splash screens, and image assets

### Import Aliases

The project uses `@/*` path alias configured in `tsconfig.json`:

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

Maps to the project root directory.

## Rating Flow Architecture

The core workflow follows the **EAT → SNAP → COMPARE → RANK** loop.

### Rating Flow Overview

1. **Entry Point** (`app/(protected)/(tabs)/index.tsx`)
    - FloatingActionButton (camera FAB) on home screen triggers rating flow
    - Navigates to `/(rating)` route group

2. **Photo Capture** (`app/(protected)/(rating)/index.tsx`)
    - User takes or selects photo from gallery using Expo ImagePicker
    - **Photo is MANDATORY** — no submission without photo
    - EXIF data extracted for GPS/timestamp verification
    - Photo stored in `useRatingStore` for later upload

3. **Restaurant Selection** (`app/(protected)/(rating)/venue-search.tsx`)
    - Search restaurants by name using `useRestaurants` hook
    - GPS location fetched using `useLocation` hook
    - Restaurants sorted by distance (PostGIS)
    - Option to create new restaurant if not found → navigates to `create-venue`

4. **Restaurant Creation** (`app/(protected)/(rating)/create-venue.tsx`) [Optional]
    - Modal presentation for adding new restaurant
    - Address autocomplete using `AddressAutocomplete` component
    - Saves to Supabase `restaurants` table with city/neighborhood linkage
    - Returns to search with new restaurant selected

5. **Dish Type Selection** (`app/(protected)/(rating)/dish-selection.tsx`)
    - Select from 5 pre-defined dish types (not free-form text)
    - Uses `useDishTypes` hook for data fetching

6. **Rating Submission** (`app/(protected)/(rating)/rating.tsx`)
    - Raw score input (INTEGER 1-10)
    - Photo preview with `PhotoPicker` component
    - Optional taste tags selection (15 pre-defined tags)
    - Optional notes (short text, not long-form review)
    - GPS verification status displayed with `LocationStatusBanner`
    - Photo uploaded to Supabase Storage (`rating-photos` bucket)
    - Rating submitted via `create_rating` RPC
    - Returns `should_compare` flag and comparison candidate

7. **This vs That Battle** (`app/(protected)/(rating)/compare.tsx`) [Conditional]
    - **Only triggered if user has prior ratings of the same dish type**
    - Full-screen split view: Photo A (top) vs Photo B (bottom)
    - Center prompt: "Which [Dish Type] wins?"
    - Tap photo to vote, or skip with reason
    - Elo adjustment applied via `process_comparison` RPC
    - Optional quick taste tag selection after voting (skippable)

### Category-Gated Comparison Logic

```
User rates "Truffle Burger" → 8.8
  ↓
System: SELECT * FROM personal_ratings WHERE user_id = ? AND dish_type_id = 'burger'
  ↓
Found 0 → Save as anchor (no comparison)
Found N → Find closest score (e.g., "Bacon Burger" at 8.6)
  ↓
UI: "Battle of the Burgers: Truffle vs. Bacon. Who wins?"
  ↓
User picks winner → Elo adjustment → Leaderboard recalculation
```

### State Management

- **`useRatingStore`** (`stores/use-rating-store.ts`):
    - Zustand store for rating flow state
    - Stores: photo URI, selected restaurant, selected dish type, raw score, taste tags, GPS location, notes
    - Persists data across navigation steps
    - Call `resetRating()` on flow completion or cancellation
    - Usage: `const { photoUri, selectedRestaurant, setSelectedRestaurant } = useRatingStore();`

### Verification

- **Photo mandatory**: No submission without photo (enforced in UI and DB constraint on `photo_url NOT NULL`)
- **GPS verification**: Location captured and distance calculated to restaurant via PostGIS
- **EXIF verification**: Photo EXIF location/timestamp extracted for proximity/freshness check
- **Must post within 4 hours** of being at restaurant (fraud prevention)

### Data Flow

```
User Action → Hook (RPC call) → Supabase → Database → Hook (response) → UI Update
```

Example:

```
Submit Rating → useCreateRating() → create_rating RPC → personal_ratings INSERT
  → returns {rating_id, should_compare, comparison_candidate}
  → if should_compare → navigate to compare screen
  → useProcessComparison() → process_comparison RPC → Elo updates → Leaderboard refresh
```

## Discover & Leaderboard Architecture

### Five Disciplined Screens

1. **Home / Discover** (`app/(protected)/(tabs)/index.tsx`)
    - Location badge at top (city/neighborhood)
    - 5 dish type pills (horizontal selector)
    - Single hero card showing #1 dish for selected type
    - Rising star card (high-rated, low-battle discoveries)
    - Recent battle ticker (live community activity)
    - Pending comparisons CTA
    - Floating camera button (FAB) to start rating flow

2. **Leaderboard** (`app/(protected)/(tabs)/leaderboard.tsx`)
    - "Best [Dish Type] in [Location]" header
    - Location toggle: City | Near Me (2 miles) | Neighborhood
    - 10-item ranked list with confidence meters
    - Crown emoji for #1
    - Each item shows: rank, restaurant name, score, confidence, photo

3. **Dish Detail** (`app/(protected)/(browse)/dish-detail.tsx`)
    - Hero photo (full width) with parallax scrolling
    - Ranking badge ("#X [Dish Type] in [Location]")
    - Confidence meter visualization
    - Crowd-sourced taste tags
    - Map card with directions CTA
    - Photo gallery from all ratings
    - "Rate This Dish" button to start rating flow
    - Uses `react-native-reanimated` for smooth animations

4. **Restaurant Detail** (`app/(protected)/(browse)/venue-detail.tsx`)
    - Hero image with parallax scrolling
    - Animated sticky header
    - Restaurant info (name, address, neighborhood)
    - All rated dish types at this restaurant
    - Navigate to dish details
    - Uses `react-native-reanimated` for smooth animations

5. **Profile** (`app/(protected)/(tabs)/profile/index.tsx`)
    - Avatar + username + home city
    - Stats row: `X dishes · X cities · X battles`
    - Best Ever cards (horizontal scrolling) — auto-generated personal best per dish type
    - Achievement badges (e.g., "Gumbo Authority" for 10+ gumbo comparisons)
    - Rating history by dish type

### Key Features

- **Dish Type Pills**: 5 pre-defined types, not free-form search
- **Hero Cards**: Photo-dominant, showing #1 for selected dish type
- **Confidence Meters**: Visual representation of data reliability
- **Three Location Views**: City-wide, nearby (2 miles), neighborhood-level
- **Rising Stars**: High-rated dishes with few battles (discovery engine)
- **Recent Battle Ticker**: Live feed of community comparisons, refreshes every 30s
- **Best Ever Cards**: Shareable personal bests — "My #1 Gumbo Ever: Dooky Chase, Dec 2024"
- **Achievement Badges**: Computed dynamically from user activity
- **Photo-Dominant Design**: Cards with gradient overlays for text readability
- **Smooth Animations**: React Native Reanimated for 60fps interactions
- **Loading Skeletons**: Better perceived performance
- **Empty States**: Friendly messages when no data available

### Taste Tags

- 15 pre-defined tags (e.g., "Dark roux", "Seafood-heavy", "Spicy", "Crispy", "Rich", "Smoky")
- Optional selection after voting in This vs That (skippable)
- Tags are scoped to dish types via `taste_tags.dish_type_id`
- Enables future AI taste profile personalization (post-MVP)

### Gamification

- **Best Ever Cards**: Auto-generated from user's highest `personal_elo` per dish type
- **Achievement Badges**: Computed from `useUserBadges()` hook based on activity thresholds
- **Charms**: Unlockable achievements stored in `charms` / `user_charms` tables
- **Credibility Score**: Global reputation displayed on profile, increases with total ratings
- **Stats Row**: `total_ratings · total_battles · total_cities` on profile

### Data Flow

```
User Action → Hook (API call) → Supabase → Database → Hook (response) → UI Update
```

Example:

```
Home Screen → useDiscoverData(locationFilter) → Supabase RPC → {dishTypes, heroes, risingStars} → UI
Leaderboard → useLeaderboard(dishTypeId, locationFilter) → global_dish_scores query → Ranked list
```

## Supabase Integration

### Database Schema

**Core Tables:**
- `cities`: Active cities (NOLA at launch). Fields: id, name, state, slug, coordinates (PostGIS), is_active
- `neighborhoods`: Neighborhoods within cities. Fields: id, city_id, name, slug, boundary (PostGIS polygon)
- `dish_types`: Controlled vocabulary of dish types (5 at launch). Fields: id, name, slug, emoji, is_active, launch_order, aliases[]
- `restaurants`: Restaurant locations. Fields: id, name, address, city_id, neighborhood_id, coordinates (PostGIS), google_place_id, is_verified, is_closed
- `profiles`: Extended user profiles (extends auth.users). Fields: id, username, display_name, avatar_url, home_city_id, bio, total_ratings, total_battles, credibility_score, expo_push_token
- `personal_ratings`: User ratings of dishes at restaurants. Fields: id, user_id, restaurant_id, dish_type_id, photo_url (NOT NULL), raw_score (INTEGER 1-10), personal_elo (DECIMAL default 1500), battles_won/lost/total, notes, location_verified, exif_location, exif_timestamp. **UNIQUE(user_id, restaurant_id, dish_type_id)**
- `comparisons`: Battle history (This vs That audit trail). Fields: id, user_id, dish_type_id, rating_a_id, rating_b_id, winner_rating_id, skipped, skip_reason, elo before/after for both ratings
- `global_dish_scores`: Pre-computed leaderboard data. Fields: id, restaurant_id, dish_type_id, city_id, neighborhood_id, avg_raw_score, total_ratings, global_elo (default 1500), total_battles, battles_won, win_rate, confidence_score, featured_photo_url
- `taste_tags`: Pre-defined taste descriptors. Fields: id, name, slug, dish_type_id
- `personal_rating_tags`: Junction table linking ratings to tags

**Supporting Tables:**
- `charms`: Unlockable achievements with rarity tiers
- `user_charms`: User's unlocked charms with progress tracking

### RPC Functions

- **`create_rating`**: Main entry point for rating submission. Returns `{rating_id, should_compare, comparison_candidate}`
- **`process_comparison`**: Process This vs That battle result. Updates personal_elo for both ratings, updates global_dish_scores
- **`get_leaderboard`**: City/neighborhood rankings by dish type
- **`get_nearby_leaderboard`**: "Near Me" rankings within radius via PostGIS
- **`get_my_best_ever`**: User's highest personal_elo dish per dish type
- **`get_user_stats`**: Profile statistics (total_dishes, total_cities, total_battles, badges)
- **`get_pending_comparisons`**: Find comparison opponents for a user/dish_type
- **`match_location`**: Match GPS coordinates to city/neighborhood
- **`check_and_grant_charms`**: Award achievement charms based on activity

### Storage Buckets

- `rating-photos`: Stores uploaded dish photos with RLS policies

### RLS Policies

- Users can insert their own ratings
- Users can upload photos for their ratings
- Public read access for approved content
- Users can only process their own comparisons

## Platform Support

Configured for iOS, Android, and Web:

- **iOS**: Tab support, uses SF Symbols
- **Android**: Edge-to-edge enabled, predictive back gesture disabled, adaptive icons configured
- **Web**: Static output mode, separate font fallbacks

## Key Configuration Files

- **`app.json`**: Expo configuration with EAS project ID, platform-specific settings
- **`tsconfig.json`**: Extends `expo/tsconfig.base`, strict mode enabled
- **`eslint.config.js`**: Flat ESLint config using `eslint-config-expo`
- **`.vscode/settings.json`**: Auto-fix and organize imports on save

## Development Notes

- The app has **no test setup** currently (no Jest/Vitest config in project root)
- Uses React Native Reanimated 4.1.1 for animations
- React Native Gesture Handler installed for touch interactions
- Color scheme automatically follows system preference
- VSCode is configured to auto-fix, organize imports, and sort members on save

## Global State Management with Zustand

This app uses **Zustand** for client-side global state management alongside React Query for server state.

### State Management Strategy

This project follows a clear separation of concerns for state management:

| State Type | Tool | Use Cases | Examples |
|------------|------|-----------|----------|
| **Server State** | React Query | API data, mutations, cache | Ratings, restaurants, leaderboards |
| **Client State** | Zustand | App-level state, UI state | Rating flow, auth, location, toasts |
| **Component State** | useState | Local UI state | Form inputs, toggles |
| **Theme/Provider** | Context API | Deep tree props | Theme tokens, Supabase client |

### Core Principles

1. **Use Zustand for client-side global state**
    - ✅ Rating flow state (photo, restaurant, dish type, score, tags, location)
    - ✅ Location state (GPS, matched city/neighborhood)
    - ✅ Location filter state (city/neighborhood/nearby toggle)
    - ✅ UI state (toasts, modals, bottom sheets)
    - ✅ User preferences (persisted with AsyncStorage)
    - ⚠️ Authentication uses `useAuth()` hook with React Query (not Zustand) for session management, but `auth.store.ts` holds client-side auth state

2. **Never duplicate server data in Zustand**
    - ❌ Storing API responses in Zustand
    - ✅ Use React Query for all server data

3. **No provider wrappers needed**
    - Zustand stores are imported directly
    - No context provider boilerplate
    - Works outside React components

### Available Stores

```typescript
import {
  useRatingStore,          // Rating flow state
  useUIStore,              // Toasts, modals, loading
  usePreferencesStore      // Persisted preferences
} from '@/stores';

import { useLocationStore } from '@/stores/location.store';
import { useLocationFilterStore } from '@/stores/use-location-filter-store';
import { useAuthStore } from '@/stores/auth.store';

// Authentication uses React Query hook
import { useAuth } from '@/hooks/use-auth';
```

### Quick Examples

**Rating Flow:**
```typescript
function RestaurantSearchScreen() {
  const { photoUri, selectedRestaurant, setSelectedRestaurant } = useRatingStore();

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    router.push('/(rating)/dish-selection');
  };
}
```

**Location Filter:**
```typescript
function LeaderboardScreen() {
  const { filterType, selectedCityName, getDisplayName } = useLocationFilterStore();
  const { setCityFilter, setNeighborhoodFilter, setNearbyFilter } = useLocationFilterStore();

  // Toggle between City | Near Me | Neighborhood
  const handleFilterChange = (type: 'city' | 'neighborhood' | 'nearby') => {
    if (type === 'nearby') setNearbyFilter(lat, lng, 3219); // 2 miles
  };
}
```

**Authentication:**
```typescript
function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Button onPress={logout}>Sign Out</Button>;
}
```

### Best Practices

1. **Use selectors for performance** - Only subscribe to needed state
2. **Reset state when appropriate** - Call `resetRating()` after submission
3. **Persist user preferences** - Use `createAsyncStoragePersist` middleware
4. **Keep stores focused** - One store per domain (auth, rating, location, UI)
5. **TypeScript everything** - All stores are fully typed

See `stores/README.md` for complete documentation, patterns, and advanced usage.

## Data Fetching with React Query

**CRITICAL:** This app uses **@tanstack/react-query** for ALL data fetching and mutations. Manual `useState` + `useEffect` patterns are **NOT recommended** for data management.

### Core Principles

1. **Use React Query for ALL Supabase interactions**
    - `useQuery` for data fetching (GET operations)
    - `useMutation` for data modifications (POST, PUT, DELETE)
    - `useInfiniteQuery` for paginated data

2. **Never use manual state management for server data**
    - ❌ `useState` + `useEffect` for API calls
    - ✅ `useQuery` or `useMutation` hooks

3. **Query Keys are semantic and hierarchical**

    ```typescript
    ['leaderboard', dishTypeId, locationFilter]   // Leaderboard for dish type + location
    ['comparisons', 'pending', userId]             // Pending battles for user
    ['personal-ratings', userId, dishTypeId]       // User's ratings for a dish type
    ['dish-types']                                 // All active dish types
    ['restaurant', restaurantId]                   // Single restaurant
    ['discover', locationFilter]                   // Discover screen batch data
    ['trending-dishes', filters]                   // Trending dishes
    ['user-stats', userId]                         // User statistics
    ['best-ever', userId]                          // User's best-ever dishes
    ```

4. **Mutations invalidate related queries**

    ```typescript
    const { mutateAsync: createRating } = useMutation({
        mutationFn: async (input) => {
            /* ... */
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['personal-ratings', variables.user_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['leaderboard', variables.dish_type_id],
            });
            queryClient.invalidateQueries({ queryKey: ['discover'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        },
    });
    ```

5. **Error handling via React Query**
    - Mutations throw errors (caught by `onError` or `try/catch` on `mutateAsync`)
    - Queries expose `error` object
    - Use `error?.message` for user-facing messages

6. **Loading states from React Query**
    - `isLoading`: Initial load (no cached data)
    - `isFetching`: Any fetch (including background refetch)
    - `isPending`: Mutation in progress

### Hook Patterns

#### Query Hook Pattern

```typescript
export function useLeaderboard(dishTypeId: string, locationFilter: LocationFilter) {
    return useQuery({
        queryKey: ['leaderboard', dishTypeId, locationFilter],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_leaderboard', {
                    p_dish_type_id: dishTypeId,
                    p_city_id: locationFilter.cityId,
                    p_neighborhood_id: locationFilter.neighborhoodId,
                });
            if (error) throw error;
            return data;
        },
        enabled: !!dishTypeId,
    });
}

// Usage in component
const { data, isLoading, error } = useLeaderboard(dishTypeId, locationFilter);
```

#### Mutation Hook Pattern

```typescript
export function useCreateRating() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRatingInput) => {
            const { data, error } = await supabase
                .rpc('create_rating', input);
            if (error) throw error;
            return data; // { rating_id, should_compare, comparison_candidate }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['personal-ratings'],
            });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
    });
}

// Usage in component
const { mutateAsync: createRating, isPending } = useCreateRating();

const handleSubmit = async (input) => {
    try {
        const result = await createRating(input);
        if (result.should_compare) {
            // Navigate to comparison screen with candidate
            router.push({ pathname: '/(rating)/compare', params: { ... } });
        }
    } catch (error) {
        // Error handling
    }
};
```

#### Infinite Query Pattern (Pagination)

```typescript
export function useTrendingDishes(filters: TrendingDishesFilters) {
    return useInfiniteQuery({
        queryKey: ['trending-dishes', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await supabase
                .rpc('get_trending_dishes', {
                    ...filters,
                    p_offset: pageParam,
                    p_limit: filters.limit,
                });
            if (error) throw error;
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === filters.limit
                ? allPages.length * filters.limit
                : undefined;
        },
        initialPageParam: 0,
    });
}
```

### Component Usage Patterns

```typescript
// ✅ CORRECT: Using React Query
function LeaderboardScreen() {
  const { dishTypeId } = useParams();
  const locationFilter = useLocationFilterStore();
  const { data, isLoading, error } = useLeaderboard(dishTypeId, locationFilter);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!data?.length) return <EmptyState message="No rankings yet" />;

  return <LeaderboardList items={data} />;
}

// ❌ WRONG: Manual state management
function LeaderboardScreen() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This pattern is NOT allowed
    fetchLeaderboard().then(setItems).finally(() => setLoading(false));
  }, []);

  // ...
}
```

### Hook Reference

All hooks use React Query:

- `useCreateRating`, `useUpdateRating`, `useMyDishRankings`, `usePersonalRating`, `useMyRatings`
- `usePendingComparisons`, `useComparisonPair`, `useProcessComparison`, `useComparisonHistory`
- `useRestaurants`, `useNearbyRestaurants`, `useCreateRestaurant`
- `useDishTypes`, `useTasteTags`
- `useDiscoverData`, `useLeaderboard`, `useTrendingDishes`, `useRisingStars`, `useRecentBattles`
- `useSearch`, `useDishDetail`, `useVenueDetail`, `useDishRatingHistory`
- `useUserStats`, `useMyBestEver`, `useProfile`, `useUserBadges`, `useUserLeaderboardPosition`
- `useCharm`, `useUserCharms`
- `usePhotoUpload`, `useLocation`, `useAddressSearch`

When creating new hooks, **always use React Query** for any server state management.

## Development Patterns to follow strictly

- Prefer `Pressable` over `Touchable opacity` both offered by react-native for touch events
- Use platform file extensions instead of runtime checks for platform specific code
- Avoid `modals` when a `bottom sheet` works better
- Prefer `FlatList` over `ScrollView` for large lists of items
- When using a `Scrollview` as the root of a screen, instead of wrapping it in a `SafeAreaView`, use the `contentInsetAdjustmentBehavior` prop and set it to `automatic`
- Keep the file `_layout.tsx` the root layout file focused only on navigation/routing
- Always use theme tokens for colors, fonts, and spacing. If a new color is needed, add it to the theme tokens and use it
