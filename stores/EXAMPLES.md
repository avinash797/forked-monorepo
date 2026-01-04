# Zustand Usage Examples

Real-world examples of using Zustand stores in this app.

## 1. Rating Flow Example

Complete example of the rating flow using `useRatingStore`:

```tsx
// app/(protected)/(rating)/index.tsx - Photo Screen
import { useRatingStore } from '@/stores';
import { router } from 'expo-router';

export default function PhotoScreen() {
  const { photoUri, setPhotoUri } = useRatingStore();

  const handlePhotoSelected = async (uri: string) => {
    setPhotoUri(uri);
    router.push('/(rating)/venue-search');
  };

  return (
    <PhotoPicker
      photoUri={photoUri}
      onPhotoSelected={handlePhotoSelected}
    />
  );
}
```

```tsx
// app/(protected)/(rating)/venue-search.tsx - Venue Selection
import { useRatingStore } from '@/stores';
import { router } from 'expo-router';

export default function VenueSearchScreen() {
  const { photoUri, setSelectedVenue } = useRatingStore();
  const { data: venues } = useVenues();

  // Ensure photo exists before proceeding
  if (!photoUri) {
    router.replace('/(rating)');
    return null;
  }

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    router.push('/(rating)/dish-selection');
  };

  return (
    <VenueList
      venues={venues}
      onVenueSelect={handleVenueSelect}
    />
  );
}
```

```tsx
// app/(protected)/(rating)/rating.tsx - Final Rating Screen
import { useRatingStore } from '@/stores';
import { useUIStore } from '@/stores';
import { router } from 'expo-router';

export default function RatingScreen() {
  const { photoUri, selectedVenue, selectedDish, location, resetRating } = useRatingStore();
  const { showToast, setGlobalLoading } = useUIStore();
  const { mutateAsync: createReview } = useCreateReview();
  const { mutateAsync: uploadPhoto } = usePhotoUpload();

  const handleSubmit = async (rating: number, reviewText: string) => {
    if (!selectedVenue || !selectedDish || !photoUri) {
      showToast('Missing required information', 'error');
      return;
    }

    setGlobalLoading(true);

    try {
      // Upload photo
      const photoUrl = await uploadPhoto({
        uri: photoUri,
        dishId: selectedDish.id,
      });

      // Submit review
      await createReview({
        dish_id: selectedDish.id,
        venue_id: selectedVenue.id,
        rating,
        review_text: reviewText,
        photo_url: photoUrl,
        location,
      });

      // Clear rating flow state
      resetRating();

      // Show success
      showToast('Review submitted!', 'success');
      router.push('/(rating)/success');
    } catch (error) {
      showToast('Failed to submit review', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <RatingForm
      dish={selectedDish}
      venue={selectedVenue}
      photoUri={photoUri}
      onSubmit={handleSubmit}
    />
  );
}
```

## 2. Authentication Example

Using `useAuthStore` for authentication:

```tsx
// app/_layout.tsx - Root Layout
import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
  const { isAuthenticated, setSession, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <Stack />;
}
```

```tsx
// app/(auth)/login.tsx - Login Screen
import { useAuthStore } from '@/stores';
import { useUIStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { setSession } = useAuthStore();
  const { showToast, setGlobalLoading } = useUIStore();

  const handleLogin = async (email: string, password: string) => {
    setGlobalLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      showToast('Welcome back!', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      showToast('Invalid credentials', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

```tsx
// app/(protected)/(tabs)/settings.tsx - Settings Screen
import { useAuthStore } from '@/stores';
import { useUIStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { showToast } = useUIStore();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      signOut(); // Clear Zustand state
      showToast('Signed out successfully', 'success');
      router.replace('/(auth)/login');
    } catch (error) {
      showToast('Failed to sign out', 'error');
    }
  };

  return (
    <View>
      <Text>Logged in as: {user?.email}</Text>
      <Button onPress={handleSignOut}>Sign Out</Button>
    </View>
  );
}
```

## 3. Protected Route Example

Using `useAuthStore` for route protection:

```tsx
// app/(protected)/_layout.tsx - Protected Routes Layout
import { useAuthStore } from '@/stores';
import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack />;
}
```

## 4. UI State Examples

### Toast Notifications

```tsx
import { useUIStore } from '@/stores';

function MyComponent() {
  const { showToast } = useUIStore();

  const handleSuccess = () => {
    showToast('Operation successful!', 'success');
  };

  const handleError = () => {
    showToast('Something went wrong', 'error');
  };

  const handleInfo = () => {
    showToast('Here is some information', 'info');
  };

  return (
    <>
      <Button onPress={handleSuccess}>Success Toast</Button>
      <Button onPress={handleError}>Error Toast</Button>
      <Button onPress={handleInfo}>Info Toast</Button>
    </>
  );
}
```

### Global Loading Overlay

```tsx
import { useUIStore } from '@/stores';

function FormComponent() {
  const { setGlobalLoading } = useUIStore();

  const handleSubmit = async () => {
    setGlobalLoading(true);

    try {
      await longRunningOperation();
    } finally {
      setGlobalLoading(false);
    }
  };

  return <Button onPress={handleSubmit}>Submit</Button>;
}
```

### Bottom Sheet

```tsx
import { useUIStore } from '@/stores';

function ListComponent() {
  const { showBottomSheet, hideBottomSheet } = useUIStore();

  const handleItemPress = (item: Item) => {
    showBottomSheet(
      <ItemDetailsSheet
        item={item}
        onClose={hideBottomSheet}
      />
    );
  };

  return <ItemList onItemPress={handleItemPress} />;
}
```

## 5. Persisted Preferences Example

```tsx
// app/(tabs)/index.tsx - Home Screen
import { useEffect } from 'react';
import { usePreferencesStore } from '@/stores';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { hasCompletedOnboarding } = usePreferencesStore();

  useEffect(() => {
    // Redirect to onboarding if not completed
    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding]);

  return <HomeFeed />;
}
```

```tsx
// app/onboarding.tsx - Onboarding Screen
import { usePreferencesStore } from '@/stores';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding, setPreferredDishTypes } = usePreferencesStore();

  const handleComplete = (selectedDishTypes: string[]) => {
    setPreferredDishTypes(selectedDishTypes);
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
```

## 6. Performance Optimization with Selectors

```tsx
// ❌ BAD: Re-renders on ANY state change
function Component() {
  const ratingStore = useRatingStore();
  return <Text>{ratingStore.photoUri}</Text>;
}

// ✅ GOOD: Only re-renders when photoUri changes
function Component() {
  const photoUri = useRatingStore((state) => state.photoUri);
  return <Text>{photoUri}</Text>;
}

// ✅ EVEN BETTER: Use destructuring for multiple values
function Component() {
  const { photoUri, selectedVenue } = useRatingStore();
  return (
    <>
      <Image source={{ uri: photoUri }} />
      <Text>{selectedVenue?.name}</Text>
    </>
  );
}
```

## 7. Using Store State Outside React Components

```tsx
// lib/analytics.ts
import { useAuthStore } from '@/stores';
import { useRatingStore } from '@/stores';

export function trackRatingEvent() {
  // Access store state outside React
  const user = useAuthStore.getState().user;
  const { selectedDish, selectedVenue } = useRatingStore.getState();

  analytics.track('rating_started', {
    userId: user?.id,
    dishId: selectedDish?.id,
    venueId: selectedVenue?.id,
  });
}
```

## 8. Subscribing to Store Changes

```tsx
// lib/logger.ts (dev only)
import { useRatingStore } from '@/stores';

if (__DEV__) {
  // Subscribe to all rating store changes
  useRatingStore.subscribe((state) => {
    console.log('Rating store changed:', {
      hasPhoto: !!state.photoUri,
      hasVenue: !!state.selectedVenue,
      hasDish: !!state.selectedDish,
      hasLocation: !!state.location,
    });
  });

  // Subscribe to specific state changes
  useRatingStore.subscribe(
    (state) => state.photoUri,
    (photoUri, prevPhotoUri) => {
      console.log('Photo changed:', { from: prevPhotoUri, to: photoUri });
    }
  );
}
```

## Summary

- **Rating Flow**: Use `useRatingStore` for multi-step form state
- **Authentication**: Use `useAuthStore` for user session management
- **UI State**: Use `useUIStore` for toasts, modals, and loading
- **Preferences**: Use `usePreferencesStore` for persisted settings
- **Performance**: Use selectors or destructuring to optimize re-renders
- **Outside React**: Use `store.getState()` to access state
- **Subscriptions**: Use `store.subscribe()` for external listeners
