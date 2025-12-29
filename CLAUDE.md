# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo React Native application using:
- **Expo SDK 54** with React Native 0.81.5
- **React 19.1.0** (latest stable)
- **Expo Router v6** for file-based navigation
- **TypeScript** with strict mode enabled
- **React Native New Architecture** (enabled via `newArchEnabled: true`)
- **Experimental features**: Typed routes and React Compiler

### Rating System

**IMPORTANT:** This app uses a **0-10 numeric rating scale** for dishes, NOT a 5-star system.

- Database stores ratings as `rating` column (0-10 scale)
- Display ratings numerically (e.g., "8.5/10" or "8.5")
- NEVER use star symbols (★) or star-based visualization
- NEVER use the word "star" when referring to ratings
- Average ratings are calculated on 0-10 scale and stored in `dishes.average_rating`
- UI should show ratings as numbers, progress bars, or other numeric visualizations

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

- **`app/(auth)/`**: Authentication flow (login, signup, password reset)
  - Accessible when user is not authenticated

- **`app/(protected)/`**: Protected routes requiring authentication
  - **`(tabs)/`**: Tab navigation group (folder with parentheses = route group, not URL segment)
    - `_layout.tsx`: Tab bar configuration with HapticTab and IconSymbol components
    - `index.tsx`: Home tab screen with FloatingActionButton to start rating flow
    - `add-review.tsx`: Entry point for adding reviews (redirects to rating flow)
    - `settings.tsx`: User settings and profile

  - **`(rating)/`**: Complete dish rating workflow ✅
    - `_layout.tsx`: Stack navigation for rating flow with modal presentation
    - `index.tsx`: Photo capture/selection screen (entry point)
    - `venue-search.tsx`: Search and select venue with GPS proximity sorting
    - `create-venue.tsx`: Add new venue modal (if venue not found)
    - `dish-selection.tsx`: Select existing dish or create new dish
    - `rating.tsx`: Rate dish with star rating, photo upload, and review text
    - `success.tsx`: Confirmation screen after successful submission

### Theme System

The app implements a comprehensive light/dark theme system:

- **`constants/theme.ts`**: Defines Colors and Fonts for both light and dark modes
- **`hooks/use-color-scheme.ts`**: Platform-specific color scheme detection
  - Native: Re-exports React Native's `useColorScheme`
  - Web: Custom implementation in `use-color-scheme.web.ts`
- **`hooks/use-theme-color.ts`**: Hook for consuming theme colors with prop overrides

### Themed Components

Reusable components that automatically adapt to light/dark mode:

- **`ThemedText`** (`components/themed-text.tsx`): Typed text variants (default, title, subtitle, link, defaultSemiBold)
- **`ThemedView`** (`components/themed-view.tsx`): View with automatic background color

These accept `lightColor` and `darkColor` props to override theme defaults.

### Component Organization

- **`components/`**: Shared UI components
  - `external-link.tsx`: Link component for opening URLs
  - `haptic-tab.tsx`: Tab button with haptic feedback
  - `themed-text.tsx`: Themed text component with variants
  - `themed-view.tsx`: Themed view with background color
  - `themed-button.tsx`: Themed button component
  - `themed-text-input.tsx`: Themed text input component
  - `themed-select.tsx`: Themed select/picker component
  - `address-autocomplete.tsx`: Address autocomplete for venue creation
  - `fork-logo.tsx`: App logo component
  - `forked-branding-header.tsx`: Branding header component
  - **`rating/`**: Rating flow components ✅
    - `photo-picker.tsx`: Photo capture/selection with preview and delete
    - `rating-input.tsx`: Star rating slider input (1-5 stars)
    - `dish-card.tsx`: Display dish information in lists
    - `venue-card.tsx`: Display venue information with distance
    - `search-input.tsx`: Reusable search input component
    - `location-status-banner.tsx`: GPS verification status display
  - `ui/`: UI primitives
    - `collapsible.tsx`: Collapsible section component
    - `icon-symbol.tsx`: Expo Material icon component

- **`hooks/`**: Custom React hooks for theming and utilities
  - Rating flow hooks:
    - `use-location.ts`: GPS location services with permission handling
    - `use-photo-upload.ts`: Photo upload to Supabase Storage
    - `use-venues.ts`: Venue search and CRUD operations
    - `use-dishes.ts`: Dish retrieval and creation
    - `use-reviews.ts`: Review submission

- **`contexts/`**: React contexts
  - `rating-context.tsx`: Global state for rating flow (photo, venue, dish, location)
  - `supabase-provider.tsx`: Supabase client provider

- **`types/`**: TypeScript type definitions
  - `rating.ts`: Complete type definitions for rating flow (Venue, Dish, Review, Photo, etc.)
  - `database.types.ts`: Auto-generated Supabase types

- **`constants/`**: Centralized theme configuration

- **`assets/images/`**: App icons, splash screens, and image assets

### Import Aliases

The project uses `@/*` path alias configured in `tsconfig.json`:
```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

Maps to the project root directory.

## Rating Flow Architecture ✅

**Status:** Complete (MVP Feature #1) | **Progress:** 100%

The core rating workflow is a multi-step modal flow that guides users through rating a dish with photo and GPS verification.

### Flow Overview

1. **Entry Point** (`app/(protected)/(tabs)/index.tsx`)
   - FloatingActionButton on home screen triggers rating flow
   - Navigates to `/(rating)` route group

2. **Photo Capture** (`app/(protected)/(rating)/index.tsx`)
   - User takes or selects photo from gallery using Expo ImagePicker
   - Photo is required before proceeding (enforced by UI)
   - Photo stored in `RatingContext` for later upload

3. **Venue Selection** (`app/(protected)/(rating)/venue-search.tsx`)
   - Search venues by name using `useVenues` hook
   - GPS location fetched using `useLocation` hook
   - Venues sorted by distance (Haversine formula)
   - Option to create new venue if not found → navigates to `create-venue`

4. **Venue Creation** (`app/(protected)/(rating)/create-venue.tsx`) [Optional]
   - Modal presentation for adding new venue
   - Address autocomplete using `AddressAutocomplete` component
   - Saves to Supabase `venues` table
   - Returns to venue search with new venue selected

5. **Dish Selection** (`app/(protected)/(rating)/dish-selection.tsx`)
   - Browse existing dishes for selected venue
   - Option to create new dish inline
   - Uses `useDishes` hook for data fetching

6. **Rating Submission** (`app/(protected)/(rating)/rating.tsx`)
   - Star rating slider (1-5 stars) using `RatingInput` component
   - Photo preview with `PhotoPicker` component
   - Optional review text input
   - GPS verification status displayed with `LocationStatusBanner`
   - Photo uploaded to Supabase Storage (`review-photos` bucket)
   - Review submitted to Supabase `reviews` table
   - GPS coordinates attached to review for verification

7. **Success Confirmation** (`app/(protected)/(rating)/success.tsx`)
   - Success message displayed
   - Option to return to home or rate another dish

### State Management

- **`RatingContext`** (`contexts/rating-context.tsx`):
  - Global state for rating flow
  - Stores: photo URI, selected venue, selected dish, GPS location
  - Persists data across navigation steps
  - Cleared on flow completion or cancellation

### Key Features

- **Photo Verification**: Photo required before submission (enforced in UI)
- **GPS Verification**: Location captured and distance calculated to venue
  - Uses Haversine formula for distance calculation
  - GPS verification status displayed but non-blocking
  - Stored in `reviews.is_gps_verified` field
- **Supabase Storage**: Photos uploaded to `review-photos` bucket with RLS policies
- **Modal Presentation**: Clean UX with card-style modal navigation
- **Distance Sorting**: Venues sorted by proximity to user's current location

### Data Flow

```
User Action → Hook (API call) → Supabase → Database/Storage → Hook (response) → UI Update
```

Example:
```
Submit Review → useReviews.submitReview() → Supabase reviews.insert() → Success → Navigate to success screen
```

### Supabase Integration

- **Tables Used**:
  - `venues`: Restaurant/eatery information
  - `dishes`: Menu items at venues
  - `reviews`: User ratings with GPS and photo verification
  - `photos`: Photo metadata (linked via Storage)

- **Storage Buckets**:
  - `review-photos`: Stores uploaded dish photos with RLS policies

- **RLS Policies**:
  - Users can insert their own reviews
  - Users can upload photos for their reviews
  - Public read access for approved content

### Components & Hooks Reference

See "Component Organization" section above for full list of:
- 6 rating-specific components (`components/rating/`)
- 5 custom hooks for rating flow (`hooks/`)
- Complete TypeScript types (`types/rating.ts`)

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
