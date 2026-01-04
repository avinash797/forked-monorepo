import { create } from 'zustand';
import { createAsyncStoragePersist } from './middleware';

interface PreferencesState {
  // User preferences
  hasCompletedOnboarding: boolean;
  preferredDishTypes: string[];
  notificationsEnabled: boolean;
  showGPSWarning: boolean;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  setPreferredDishTypes: (types: string[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setShowGPSWarning: (show: boolean) => void;
  resetPreferences: () => void;
}

const initialState = {
  hasCompletedOnboarding: false,
  preferredDishTypes: [],
  notificationsEnabled: true,
  showGPSWarning: true,
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
