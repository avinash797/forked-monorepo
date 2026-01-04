# Zustand Store Guide

## Overview

This project uses **Zustand** for global state management alongside **React Query** for server state.

### State Management Strategy

- **React Query** → Server state (API calls, data fetching, mutations)
- **Zustand** → Client state (UI state, user preferences, app-level state)
- **React Context** → Theme and deep component tree props

## Available Stores

### 1. `useRatingStore` - Rating Flow State

Manages the multi-step rating workflow state.

```tsx
import { useRatingStore } from '@/stores';

function PhotoScreen() {
  const { photoUri, setPhotoUri, resetRating } = useRatingStore();

  const handlePhotoSelected = (uri: string) => {
    setPhotoUri(uri);
    router.push('/(rating)/venue-search');
  };

  return <PhotoPicker photoUri={photoUri} onPhotoSelected={handlePhotoSelected} />;
}
```

**State:**
- `photoUri: string | null` - Selected photo URI
- `selectedVenue: Venue | null` - Selected venue
- `selectedDish: Dish | null` - Selected dish
- `location: Location | null` - GPS location

**Actions:**
- `setPhotoUri(uri)` - Update photo
- `setSelectedVenue(venue)` - Update venue
- `setSelectedDish(dish)` - Update dish
- `setLocation(location)` - Update location
- `resetRating()` - Clear all state (call after submission)

### 2. `useAuthStore` - Client-Side Auth State (Optional)

**NOTE:** Authentication is now handled by the `useAuth()` hook in `@/hooks/use-auth` which uses React Query. This store is available for any additional client-side auth state needs, but the primary auth logic uses the hook.

For authentication, use:
```tsx
import { useAuth } from '@/hooks/use-auth';

function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View>
      <Text>Welcome, {user?.display_name}</Text>
      <Button onPress={logout}>Sign Out</Button>
    </View>
  );
}
```

See `hooks/use-auth.ts` for complete authentication documentation.

### 3. `useUIStore` - UI State

Manages global UI elements like toasts, bottom sheets, and loading overlays.

```tsx
import { useUIStore } from '@/stores';

function MyComponent() {
  const { showToast, setGlobalLoading } = useUIStore();

  const handleSubmit = async () => {
    setGlobalLoading(true);
    try {
      await submitData();
      showToast('Success!', 'success');
    } catch (error) {
      showToast('Error occurred', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  return <Button onPress={handleSubmit}>Submit</Button>;
}
```

**State:**
- `toast` - Toast notification state
- `bottomSheet` - Bottom sheet state
- `isGlobalLoading` - Global loading overlay

**Actions:**
- `showToast(message, type)` - Show toast
- `hideToast()` - Hide toast
- `showBottomSheet(content)` - Show bottom sheet
- `hideBottomSheet()` - Hide bottom sheet
- `setGlobalLoading(isLoading)` - Toggle loading

## Usage Patterns

### 1. Simple State Access

```tsx
function Component() {
  const photoUri = useRatingStore((state) => state.photoUri);
  const setPhotoUri = useRatingStore((state) => state.setPhotoUri);

  // Use photoUri and setPhotoUri
}
```

### 2. Multiple Values (Recommended)

```tsx
function Component() {
  const { photoUri, selectedVenue, setPhotoUri } = useRatingStore();

  // Use all values
}
```

### 3. Selective Re-renders (Performance)

```tsx
// Only re-renders when photoUri changes
function Component() {
  const photoUri = useRatingStore((state) => state.photoUri);

  return <Image source={{ uri: photoUri }} />;
}
```

### 4. Actions Only (No Re-render)

```tsx
// Never re-renders, only gets actions
function Component() {
  const resetRating = useRatingStore((state) => state.resetRating);

  return <Button onPress={resetRating}>Reset</Button>;
}
```

## Advanced Patterns

### Async Actions

```tsx
// In store file
export const useAuthStore = create<AuthState>((set, get) => ({
  // ... state

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({
        session: data.session,
        user: data.user,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// In component
const { signIn } = useAuthStore();
await signIn(email, password);
```

### Computed Values

```tsx
export const useRatingStore = create<RatingState>((set, get) => ({
  // ... state

  // Computed: check if flow is complete
  isFlowComplete: () => {
    const state = get();
    return !!(
      state.photoUri &&
      state.selectedVenue &&
      state.selectedDish &&
      state.location
    );
  },
}));
```

### Store Subscriptions (Outside Components)

```tsx
import { useRatingStore } from '@/stores';

// Subscribe to changes outside React
const unsub = useRatingStore.subscribe(
  (state) => state.photoUri,
  (photoUri) => {
    console.log('Photo changed:', photoUri);
  }
);

// Cleanup
unsub();
```

## Migration from Context

### Before (Context)

```tsx
// contexts/rating-context.tsx
export const RatingProvider = ({ children }) => {
  const [photoUri, setPhotoUri] = useState(null);
  // ...

  return (
    <RatingContext.Provider value={{ photoUri, setPhotoUri }}>
      {children}
    </RatingContext.Provider>
  );
};

// Component
function Component() {
  const { photoUri, setPhotoUri } = useContext(RatingContext);
  // ...
}
```

### After (Zustand)

```tsx
// stores/use-rating-store.ts
export const useRatingStore = create((set) => ({
  photoUri: null,
  setPhotoUri: (uri) => set({ photoUri: uri }),
}));

// Component (no provider needed!)
function Component() {
  const { photoUri, setPhotoUri } = useRatingStore();
  // ...
}
```

**Benefits:**
- No provider wrapper needed
- Less boilerplate
- Better TypeScript inference
- Easy to use outside React components
- Automatic re-render optimization

## Best Practices

1. **Keep stores focused** - One store per domain (auth, rating, UI)
2. **Use selectors for performance** - Only subscribe to needed state
3. **Avoid large objects** - Split state into smaller pieces
4. **Use React Query for server state** - Don't duplicate API data in Zustand
5. **Reset state when needed** - Clear stores on logout/completion
6. **TypeScript everywhere** - Define interfaces for all stores

## When to Use Zustand vs React Query

| Use Zustand | Use React Query |
|-------------|-----------------|
| UI state (modals, toasts) | API data fetching |
| User preferences | Server mutations |
| App-level flags | Paginated data |
| Form wizard state | Real-time data |
| Client-only state | Cached server data |

## Debugging

```tsx
// Log all state changes (dev only)
import { useRatingStore } from '@/stores';

if (__DEV__) {
  useRatingStore.subscribe((state) => {
    console.log('Rating store changed:', state);
  });
}
```

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
