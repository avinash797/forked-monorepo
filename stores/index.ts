/**
 * Zustand Stores
 *
 * Global state management using Zustand.
 *
 * NOTE: For authentication, use `useAuth()` from '@/hooks/use-auth' instead of useAuthStore.
 * The auth hook uses React Query and requires no provider.
 *
 * Usage:
 * ```tsx
 * import { useRatingStore, useUIStore, usePreferencesStore } from '@/stores';
 * import { useAuth } from '@/hooks/use-auth';
 *
 * function MyComponent() {
 *   const { photoUri, setPhotoUri } = useRatingStore();
 *   const { user, isAuthenticated, logout } = useAuth(); // Auth uses React Query hook
 *   const { showToast } = useUIStore();
 *   const { hasCompletedOnboarding } = usePreferencesStore();
 *
 *   return <View>...</View>;
 * }
 * ```
 */

export { useRatingStore } from './use-rating-store';
export { useAuthStore } from './use-auth-store'; // Optional - auth uses useAuth() hook
export { useUIStore } from './use-ui-store';
export { usePreferencesStore } from './use-preferences-store';
