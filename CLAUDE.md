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

### Rating System

**IMPORTANT:** This app uses a **0-10 numeric rating scale** for dishes, NOT a 5-star system.

- Database stores ratings as `rating` column (DECIMAL 0-10 scale, e.g., 8.5)
- Display ratings numerically (e.g., "8.5/10" or "8.5")
- NEVER use star symbols (★) or star-based visualization
- NEVER use the word "star" when referring to ratings
- Average ratings are calculated on 0-10 scale and stored in `dishes.average_rating`
- UI shows ratings as numbers with "/10" suffix or progress indicators
- Rating input uses a slider or numeric input (0-10 range)
- **Changed from 1-5 stars to 0-10 scale on 2025-12-29** (migration 20250101000020)

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
        - `index.tsx`: Home feed showing top-rated dishes with pagination and pull-to-refresh
        - `add-review.tsx`: Entry point for adding reviews (redirects to rating flow)
        - `settings.tsx`: User settings and profile

    - **`(rating)/`**: Complete dish rating workflow ✅
        - `_layout.tsx`: Stack navigation for rating flow with modal presentation
        - `index.tsx`: Photo capture/selection screen (entry point)
        - `venue-search.tsx`: Search and select venue with GPS proximity sorting
        - `create-venue.tsx`: Add new venue modal (if venue not found)
        - `dish-selection.tsx`: Select existing dish or create new dish
        - `rating.tsx`: Rate dish with 0-10 numeric rating, photo upload, and review text
        - `success.tsx`: Confirmation screen after successful submission

    - **`(browse)/`**: Browse and search functionality ✅
        - `_layout.tsx`: Stack navigation for browse screens
        - `search.tsx`: Search dishes and venues with grouped results
        - `dish-detail.tsx`: View dish details, reviews, photos, and venue info
        - `venue-detail.tsx`: View venue details, all dishes, and reviews

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
        - `rating-input.tsx`: Numeric rating slider input (0-10 scale)
        - `dish-card.tsx`: Display dish information in lists
        - `venue-card.tsx`: Display venue information with distance
        - `search-input.tsx`: Reusable search input component
        - `location-status-banner.tsx`: GPS verification status display
    - **`browse/`**: Browse and discovery components ✅
        - `review-card.tsx`: Display review with ScoreBadge, text, photos, and user info
        - `dish-card-with-rating.tsx`: Photo-dominant card with gradient overlay and ScoreBadge
        - `photo-gallery.tsx`: Grid-based photo gallery with modal viewer
        - `section-header.tsx`: Consistent section titles with optional subtitle
        - `empty-state.tsx`: Empty state component for no data scenarios
    - `score-badge.tsx`: Color-coded rating badge (green ≥7.0, yellow 4.0-6.9, red <4.0) with gradient
    - `ui/`: UI primitives
        - `collapsible.tsx`: Collapsible section component
        - `icon-symbol.tsx`: Expo Material icon component

- **`hooks/`**: Custom React hooks using **@tanstack/react-query** for data fetching and mutations
    - **All network data manipulating hooks use React Query** (`useQuery`, `useMutation`, `useInfiniteQuery`) for data management
    - Rating flow hooks:
        - `use-location.ts`: GPS location services with permission handling (uses `useQuery`)
        - `use-photo-upload.ts`: Photo upload to Supabase Storage (uses `useMutation`)
        - `use-venues.ts`: Venue search (uses `useQuery`) and CRUD operations (uses `useMutation`)
        - `use-dishes.ts`: Dish retrieval (uses `useQuery`) and creation (uses `useMutation`)
        - `use-reviews.ts`: Review submission (uses `useMutation`)
        - `use-address-search.ts`: Mapbox address search with debouncing (uses `useQuery`)
    - Browse/discovery hooks:
        - `use-top-dishes.ts`: Fetch top-rated dishes with pagination (uses `useInfiniteQuery`)
        - `use-search.ts`: Search dishes and venues (uses `useQuery` with debouncing)
        - `use-dish-detail.ts`: Fetch dish details with reviews (uses `useQuery`)
        - `use-venue-detail.ts`: Fetch venue details with dishes (uses `useQuery`)
        - `use-leaderboard.ts`: Fetch leaderboard data by dish type (uses `useQuery`)

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

The core rating workflow is a multi-step modal flow that guides users through rating a dish with photo and GPS verification using a 0-10 numeric scale.

## Browse & Discovery Architecture ✅

**Status:** Complete (MVP Feature #2) | **Progress:** 100%

The browse and discovery system allows users to explore top-rated dishes, search for specific dishes/venues, and view detailed information about dishes and venues.

### Browse Flow Overview

1. **Home Feed** (`app/(protected)/(tabs)/index.tsx`)
    - Displays top-rated dishes using `useTopDishes` hook
    - Pagination with "Load More" button
    - Pull-to-refresh functionality
    - Navigate to dish detail or search screen
    - Empty state when no dishes available

2. **Search** (`app/(protected)/(browse)/search.tsx`)
    - Search input with auto-focus
    - Search dishes and venues using `useSearch` hook
    - Results grouped by type (dishes vs venues)
    - Minimum 2 characters to trigger search
    - Navigate to dish or venue detail pages

3. **Dish Detail** (`app/(protected)/(browse)/dish-detail.tsx`)
    - **Hero image section** with parallax scrolling effect
    - **Animated sticky header** that fades in on scroll
    - View dish information (name, price, category, rating with ScoreBadge)
    - Photo gallery with all review photos
    - List of all reviews using `ReviewCard` component
    - Navigate to venue detail
    - "Rate This Dish" button to start rating flow
    - Uses `react-native-reanimated` for smooth animations

4. **Venue Detail** (`app/(protected)/(browse)/venue-detail.tsx`)
    - **Hero image section** with parallax scrolling effect
    - **Animated sticky header** that fades in on scroll
    - View venue information (name, address, cuisine, hours)
    - List all dishes at the venue
    - Reviews for the venue
    - Navigate to dish details
    - Uses `react-native-reanimated` for smooth animations

### Key Features

- **Pagination**: Load more dishes as user scrolls
- **Search**: Fast search across dishes and venues
- **Hero Images**: Full-screen hero sections with parallax scrolling
- **Animated Headers**: Sticky headers that fade in smoothly on scroll
- **Color-Coded Ratings**: ScoreBadge component (green/yellow/red)
- **Photo-Dominant Design**: Cards with gradient overlays for better text readability
- **Photo Gallery**: Grid-based photo display with modal viewer
- **Empty States**: Friendly messages when no data available
- **Loading Skeletons**: Better perceived performance
- **Smooth Animations**: React Native Reanimated for 60fps interactions

### Components

- `ReviewCard`: Displays review with ScoreBadge, text, photos, user info
- `DishCardWithRating`: Photo-dominant card with gradient overlay and ScoreBadge
- `PhotoGallery`: Grid-based photo viewer
- `SectionHeader`: Consistent section titles
- `EmptyState`: No data scenarios with action buttons
- `ScoreBadge`: Color-coded rating badge with gradient (uses expo-linear-gradient)

### Data Flow

```
User Action → Hook (API call) → Supabase → Database → Hook (response) → UI Update
```

Example:

```
Browse Home → useTopDishes() → Supabase dishes query → Dishes list → DishCardWithRating
```

### Rating Flow Overview (0-10 Scale)

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
    - Numeric rating slider (0-10 scale) using `RatingInput` component
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
    ['dish', dishId][('dishes', venueId)][('reviews', dishId)][ // Single dish // Dishes for a venue // Reviews for a dish
        ('venue', venueId)
    ][('top-dishes', filters)]; // Single venue // Top dishes with filters
    ```

4. **Mutations invalidate related queries**

    ```typescript
    const { mutateAsync: createReview } = useMutation({
        mutationFn: async (input) => {
            /* ... */
        },
        onSuccess: (data, variables) => {
            // Invalidate all related queries
            queryClient.invalidateQueries({
                queryKey: ['dish', variables.dish_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['reviews', variables.dish_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['venue', variables.venue_id],
            });
            queryClient.invalidateQueries({ queryKey: ['top-dishes'] });
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
export function useDishDetail(dishId: string | null) {
    return useQuery({
        queryKey: ['dish', dishId],
        queryFn: async () => {
            if (!dishId) throw new Error('No dish ID');
            const { data, error } = await supabase
                .from('dishes')
                .select('*, reviews(*)')
                .eq('id', dishId)
                .single();
            if (error) throw error;
            return { dish: data, reviews: data.reviews };
        },
        enabled: !!dishId,
    });
}

// Usage in component
const { data, isLoading, error } = useDishDetail(dishId);
const { dish, reviews = [] } = data || {};
```

#### Mutation Hook Pattern

```typescript
export function useCreateDish() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateDishInput) => {
            const { data, error } = await supabase
                .from('dishes')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['dishes', variables.venue_id],
            });
            queryClient.invalidateQueries({ queryKey: ['top-dishes'] });
        },
    });
}

// Usage in component
const { mutateAsync: createDish, isPending } = useCreateDish();

const handleSubmit = async (input) => {
    try {
        const dish = await createDish(input);
        // Success handling
    } catch (error) {
        // Error handling
    }
};
```

#### Infinite Query Pattern (Pagination)

```typescript
export function useTopDishes(filters: TopDishesFilters) {
    return useInfiniteQuery({
        queryKey: ['top-dishes', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await supabase
                .from('dishes')
                .select('*')
                .range(pageParam, pageParam + filters.limit - 1);
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

// Usage in component
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTopDishes(filters);
const dishes = data?.pages.flat() || [];
```

### Component Usage Patterns

```typescript
// ✅ CORRECT: Using React Query
function DishDetailScreen() {
  const { dishId } = useParams();
  const { data, isLoading, error } = useDishDetail(dishId);
  const { dish, reviews = [] } = data || {};

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!dish) return <NotFound />;

  return <DishView dish={dish} reviews={reviews} />;
}

// ❌ WRONG: Manual state management
function DishDetailScreen() {
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This pattern is NOT allowed
    fetchDish().then(setDish).finally(() => setLoading(false));
  }, []);

  // ...
}
```

### Migration Notes

All hooks have been migrated to React Query:

- `useVenueSearch`, `useNearbyVenues`, `useCreateVenue`
- `useVenueDishes`, `useDishTypes`, `useCreateDish`
- `useDishDetail`, `useVenueDetail`
- `useTopDishes` (infinite query)
- `useSearch`, `useLeaderboard`
- `useCreateReview`, `usePhotoUpload`
- `useLocation`, `useAddressSearch`

When creating new hooks, **always use React Query** for any server state management.

## Development Patterns to follow strictly

- Prefer `Pressable` over `Touchable opacity` both offered by react-native for touch events
- Use platform file extensions instead of runtime checks for platform specific code
- Avoid `modals` when a `bottom sheet` works better
- Prefer `FlatList` over `ScrollView` for large lists of items
- When using a `Scrollview` as the root of a screen, instead of wrapping it in a `SafeAreaView`, use the `contentInsetAdjustmentBehavior` prop and set it to `automatic`
- Keep the file `_layout.tsx` the root layout file focused only on navigation/routing
- Always use theme tokens for colors, fonts, and spacing. If a new color is needed, add it to the theme tokens and use it
