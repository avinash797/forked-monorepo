import { supabase } from '@/lib/supabase';
import type { AuthState, Profile } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

// Query key constants
export const AUTH_KEYS = {
    session: ['auth', 'session'] as const,
    profile: (userId?: string) => ['profile', userId ?? 'none'] as const,
};

interface UseAuthReturn extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    signup: (
        email: string,
        password: string,
        displayName: string
    ) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

/**
 * Authentication hook using React Query
 *
 * Manages auth state, session, and profile data using React Query for server state.
 * No provider needed - this hook can be used directly in any component.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={(email, password) => login(email, password)} />;
 *   }
 *
 *   return <div>Welcome, {user?.display_name}</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
    const queryClient = useQueryClient();

    // Fetch current session
    const {
        data: session,
        isLoading: isSessionLoading,
        error: sessionError,
    } = useQuery({
        queryKey: AUTH_KEYS.session,
        queryFn: async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
    });

    // Fetch user profile (depends on session)
    const {
        data: profileData,
        isLoading: isProfileLoading,
        error: profileError,
    } = useQuery({
        queryKey: AUTH_KEYS.profile(session?.user?.id),
        queryFn: async () => {
            if (!session?.user?.id) {
                return null;
            }

            const userId = session.user.id;

            // Fetch user profile
            const { data: profile, error: profileError } = (await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()) as { data: Profile | null; error: any };

            if (profileError) throw profileError;

            // Fetch user charms
            const { data: charms, error: charmsError } = await supabase
                .from('user_charms')
                .select('id:charm_id, timestamp: unlocked_at')
                .eq('user_id', userId);

            if (charmsError) throw charmsError;

            return {
                user: {
                    id: session.user.id,
                    email: session.user.email!,
                    display_name: profile?.display_name ?? undefined,
                    avatar_url: profile?.avatar_url ?? undefined,
                },
                profile: { ...profile, charms } as Profile,
            };
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Listen for auth state changes and invalidate queries
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event: string, newSession: Session | null) => {
                // Invalidate session query to trigger refetch
                queryClient.invalidateQueries({
                    queryKey: AUTH_KEYS.session,
                });

                // If session changed, invalidate profile
                if (newSession?.user?.id) {
                    queryClient.invalidateQueries({
                        queryKey: AUTH_KEYS.profile(newSession.user.id),
                    });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [queryClient]);

    // Login mutation
    const { mutateAsync: login } = useMutation({
        mutationFn: async ({
            email,
            password,
        }: {
            email: string;
            password: string;
        }) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
        },
    });

    // Signup mutation
    const { mutateAsync: signup } = useMutation({
        mutationFn: async ({
            email,
            password,
            displayName,
        }: {
            email: string;
            password: string;
            displayName: string;
        }) => {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: displayName },
                },
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
        },
    });

    // Logout mutation
    const { mutateAsync: logout } = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
            queryClient.clear(); // Clear all cached data on logout
        },
    });

    // Reset password mutation
    const { mutateAsync: resetPassword } = useMutation({
        mutationFn: async (email: string) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
        },
    });

    // Derive auth state from queries
    const state: AuthState = useMemo(() => {
        const isLoading = isSessionLoading || isProfileLoading;
        const hasError = sessionError || profileError;

        if (isLoading) {
            return {
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: true,
            };
        }

        if (hasError || !session?.user) {
            return {
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
            };
        }

        return {
            user: profileData?.user ?? null,
            profile: profileData?.profile ?? null,
            isAuthenticated: !!session?.user,
            isLoading: false,
        };
    }, [
        isSessionLoading,
        isProfileLoading,
        sessionError,
        profileError,
        session,
        profileData,
    ]);

    // Return combined state and actions
    return useMemo(
        () => ({
            ...state,
            login: (email: string, password: string) =>
                login({ email, password }),
            signup: (email: string, password: string, displayName: string) =>
                signup({ email, password, displayName }),
            logout: () => logout(),
            resetPassword: (email: string) => resetPassword(email),
        }),
        [state, login, signup, logout, resetPassword]
    );
}
