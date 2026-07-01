import { UserProfile } from '@forked/types/auth';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
    // Auth state
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,

    // Actions
    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
        }),

    setSession: (session) =>
        set({
            session,
            user: session?.user ?? null,
            isAuthenticated: !!session?.user,
            isLoading: false,
        }),

    setIsLoading: (isLoading) => set({ isLoading }),

    signOut: () =>
        set({
            user: null,
            session: null,
            isAuthenticated: false,
            profile: null,
        }),
}));
