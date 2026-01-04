/**
 * Zustand Middleware Utilities
 *
 * Common middleware for Zustand stores including:
 * - Persistence (AsyncStorage)
 * - DevTools integration
 * - Logging (dev only)
 */

import { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

/**
 * Creates a persist middleware for React Native using AsyncStorage
 *
 * @example
 * ```ts
 * export const useAuthStore = create(
 *   createAsyncStoragePersist(
 *     (set) => ({
 *       user: null,
 *       setUser: (user) => set({ user }),
 *     }),
 *     { name: 'auth-storage' }
 *   )
 * );
 * ```
 */
export const createAsyncStoragePersist = <T>(
  config: StateCreator<T>,
  options: PersistOptions<T>
) => {
  return persist(config, {
    ...options,
    storage: createJSONStorage(() => AsyncStorage),
  });
};

/**
 * Logger middleware for development
 * Logs all state changes to console
 *
 * @example
 * ```ts
 * export const useStore = create(
 *   logger(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((state) => ({ count: state.count + 1 })),
 *     }),
 *     'MyStore'
 *   )
 * );
 * ```
 */
export const logger = <T>(
  config: StateCreator<T>,
  name?: string
): StateCreator<T> => {
  return (set, get, api) =>
    config(
      (args) => {
        if (__DEV__) {
          console.log(`[${name || 'Store'}] Before:`, get());
          set(args);
          console.log(`[${name || 'Store'}] After:`, get());
        } else {
          set(args);
        }
      },
      get,
      api
    );
};

/**
 * Immer middleware for immutable state updates
 * Makes it easier to update nested state
 *
 * Note: Requires 'immer' package to be installed
 *
 * @example
 * ```ts
 * import { immer } from 'zustand/middleware/immer';
 *
 * export const useStore = create(
 *   immer<State>((set) => ({
 *     nested: { count: 0 },
 *     increment: () =>
 *       set((state) => {
 *         state.nested.count++; // Direct mutation with immer
 *       }),
 *   }))
 * );
 * ```
 */

/**
 * DevTools middleware for debugging
 * Integrates with Redux DevTools Extension
 *
 * Note: Requires 'zustand/middleware' devtools
 *
 * @example
 * ```ts
 * import { devtools } from 'zustand/middleware';
 *
 * export const useStore = create(
 *   devtools(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((state) => ({ count: state.count + 1 })),
 *     }),
 *     { name: 'MyStore' }
 *   )
 * );
 * ```
 */
