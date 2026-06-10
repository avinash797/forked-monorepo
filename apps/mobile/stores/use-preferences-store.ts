import { create } from 'zustand';
import { createAsyncStoragePersist } from './middleware';

interface PreferencesState {
  // User preferences
  hasCompletedOnboarding: boolean;
  preferredDishTypes: string[];
  notificationsEnabled: boolean;
  showGPSWarning: boolean;

  // Store review tracking
  ratingsCompletedSinceReview: number;
  lastReviewPromptDate: number | null;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  setPreferredDishTypes: (types: string[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setShowGPSWarning: (show: boolean) => void;
  incrementRatingsCompleted: () => void;
  setLastReviewPromptDate: (date: number) => void;
  resetPreferences: () => void;
}

const initialState = {
  hasCompletedOnboarding: false,
  preferredDishTypes: [],
  notificationsEnabled: true,
  showGPSWarning: true,
  ratingsCompletedSinceReview: 0,
  lastReviewPromptDate: null,
};

/**
 * Persisted preferences store
 *
 * This store automatically saves to AsyncStorage and persists across app restarts.
 *
 * Usage:
 * ```tsx
 * const { hasCompletedOnboarding, setHasCompletedOnboarding } = usePreferencesStore();
 * ```
 */
export const usePreferencesStore = create<PreferencesState>()(
  createAsyncStoragePersist(
    (set) => ({
      ...initialState,

      // Actions
      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),

      setPreferredDishTypes: (types) => set({ preferredDishTypes: types }),

      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),

      setShowGPSWarning: (show) => set({ showGPSWarning: show }),

      incrementRatingsCompleted: () =>
        set((state) => ({
          ratingsCompletedSinceReview: state.ratingsCompletedSinceReview + 1,
        })),

      setLastReviewPromptDate: (date) =>
        set({ ratingsCompletedSinceReview: 0, lastReviewPromptDate: date }),

      resetPreferences: () => set(initialState),
    }),
    {
      name: 'user-preferences', // AsyncStorage key
      // Optionally, you can customize which keys to persist:
      // partialize: (state) => ({
      //   hasCompletedOnboarding: state.hasCompletedOnboarding,
      //   preferredDishTypes: state.preferredDishTypes,
      // }),
    }
  )
);
