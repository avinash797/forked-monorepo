import { randomNonce, sha256Hex } from '@/lib/nonce';
import { supabase } from '@/lib/supabase';
import type { AuthState, UserProfile } from '@forked/types/auth';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useMemo } from 'react';

export class AuthCancelledError extends Error {
    constructor() {
        super('Sign-in cancelled');
        this.name = 'AuthCancelledError';
    }
}

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

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
    signInWithApple: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
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

            // Fetch user profile with city join
            const { data: profile, error: profileError } = (await supabase
                .from('profiles')
                .select('*, home_city:cities!home_city_id(name, state)')
                .eq('id', userId)
                .single()) as { data: UserProfile | null; error: any };

            if (profileError) throw profileError;

            return {
                user: {
                    id: session.user.id,
                    email: session.user.email!,
                    display_name: profile?.display_name ?? undefined,
                    avatar_url: profile?.avatar_url ?? undefined,
                },
                profile: { ...profile } as UserProfile,
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
                // Only react to meaningful auth changes, not routine token refreshes
                if (
                    event === 'SIGNED_IN' ||
                    event === 'SIGNED_OUT' ||
                    event === 'PASSWORD_RECOVERY'
                ) {
                    queryClient.invalidateQueries({
                        queryKey: AUTH_KEYS.session,
                    });

                    if (newSession?.user?.id) {
                        queryClient.invalidateQueries({
                            queryKey: AUTH_KEYS.profile(newSession.user.id),
                        });
                    }
                } else if (event === 'TOKEN_REFRESHED') {
                    // Update session cache directly without refetching profile
                    queryClient.setQueryData(AUTH_KEYS.session, newSession);
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

    // Sign in with Apple (iOS only)
    const { mutateAsync: signInWithApple } = useMutation({
        mutationFn: async () => {
            const rawNonce = await randomNonce();
            const hashedNonce = await sha256Hex(rawNonce);

            let credential: AppleAuthentication.AppleAuthenticationCredential;
            try {
                credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                    nonce: hashedNonce,
                });
            } catch (e: any) {
                if (e?.code === 'ERR_REQUEST_CANCELED') {
                    throw new AuthCancelledError();
                }
                throw e;
            }

            if (!credential.identityToken) {
                throw new Error(
                    'Apple sign-in did not return an identity token'
                );
            }

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
                nonce: rawNonce,
            });
            if (error) throw error;

            const fullName = [
                credential.fullName?.givenName,
                credential.fullName?.familyName,
            ]
                .filter(Boolean)
                .join(' ')
                .trim();

            if (fullName && data.user) {
                await supabase
                    .from('profiles')
                    .update({ display_name: fullName })
                    .eq('id', data.user.id)
                    .is('display_name', null);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
        },
    });

    // Sign in with Google
    const { mutateAsync: signInWithGoogle } = useMutation({
        mutationFn: async () => {
            try {
                await GoogleSignin.hasPlayServices();
                const res = await GoogleSignin.signIn();
                const idToken =
                    (res as any)?.data?.idToken ?? (res as any)?.idToken;
                if (!idToken) {
                    throw new Error(
                        'Google sign-in did not return an id token'
                    );
                }
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });
                if (error) throw error;
            } catch (e: any) {
                if (
                    e?.code === statusCodes.SIGN_IN_CANCELLED ||
                    e?.code === statusCodes.IN_PROGRESS
                ) {
                    throw new AuthCancelledError();
                }
                throw e;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
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
            signInWithApple: () => signInWithApple(),
            signInWithGoogle: () => signInWithGoogle(),
        }),
        [
            state,
            login,
            signup,
            logout,
            resetPassword,
            signInWithApple,
            signInWithGoogle,
        ]
    );
}
