import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
    ThemeProvider as NavigationThemeProvider,
    type Theme as NavigationTheme,
} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BadgeCelebrationModal } from '@/components/badges/badge-celebration-modal';

import { ThemeProvider, useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { initAmplitude } from '@/lib/amplitude';
import {
    asyncStoragePersister,
    PERSIST_MAX_AGE,
    shouldDehydrateQuery,
} from '@/lib/query-persister';

const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
});

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: false,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',

    // Performance: 20% of transactions — enough to spot issues, won't blow quota
    tracesSampleRate: 0.2,
    enableAutoPerformanceTracing: true,
    enableAppStartTracking: true,
    enableNativeFramesTracking: true,
    enableStallTracking: true,

    // Session replay: 10% of normal sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Attach a screenshot to every crash report
    attachScreenshot: true,

    // Strip PII before sending
    beforeSend: (event) => {
        if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
        }
        return event;
    },

    integrations: [
        Sentry.reactNativeTracingIntegration(),
        navigationIntegration,
        Sentry.mobileReplayIntegration({
            maskAllText: true,
            maskAllImages: true,
        }),
    ],

    // Profiling: 20% of traced transactions
    profilesSampleRate: 0.2,
});

SplashScreen.preventAutoHideAsync();

if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../reactotronConfig');
}

function RootLayoutNav() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { theme, isDark } = useTheme();
    const segments = useSegments();
    const router = useRouter();
    const navigationRef = useNavigationContainerRef();
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const hasNavigated = useRef(false);
    initAmplitude();

    // Identify user in Sentry for crash/error correlation
    useEffect(() => {
        if (isAuthenticated && user) {
            Sentry.setUser({
                id: user.id,
                username: user.display_name,
            });
        } else {
            Sentry.setUser(null);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (navigationRef.current) {
            navigationIntegration.registerNavigationContainer(navigationRef);
        }
    }, [navigationRef]);

    useEffect(() => {
        const unsubscribe = navigationRef.addListener('state', () => {
            setIsNavigationReady(true);
        });
        // If already ready (e.g. navigation state already exists)
        if (navigationRef.isReady()) {
            setIsNavigationReady(true);
        }
        return unsubscribe;
    }, [navigationRef]);

    // Create React Navigation theme from our active theme
    const navigationTheme: NavigationTheme = useMemo(
        () =>
            ({
                dark: isDark,
                colors: {
                    primary: theme.color.accent,
                    background: theme.color.bg,
                    card: theme.color.surface,
                    text: theme.color.textPrimary,
                    border: theme.color.border,
                    notification: theme.color.accent,
                },
                fonts: {
                    regular: {
                        fontFamily: theme.font.family.regular,
                        fontWeight: theme.font.weight.regular,
                    },
                    medium: {
                        fontFamily: theme.font.family.medium,
                        fontWeight: theme.font.weight.medium,
                    },
                    bold: {
                        fontFamily: theme.font.family.bold,
                        fontWeight: theme.font.weight.bold,
                    },
                    heavy: {
                        fontFamily: theme.font.family.mono,
                        fontWeight: theme.font.weight.bold,
                    },
                },
            }) as any,
        [theme, isDark]
    );

    useEffect(() => {
        if (isLoading || !isNavigationReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(protected)/(tabs)');
        }

        // Auth resolved and correct route is active (or redirect queued).
        // Hide splash after a short delay to let router.replace() commit.
        if (!hasNavigated.current) {
            hasNavigated.current = true;
            setTimeout(() => SplashScreen.hideAsync(), 50);
        }
    }, [isAuthenticated, isLoading, isNavigationReady, segments]);

    // Keep native splash screen visible while auth state resolves
    if (isLoading) {
        return null;
    }

    return (
        <NavigationThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen
                    name="(protected)"
                    options={{ headerShown: false }}
                />
            </Stack>
            <StatusBar style={navigationTheme.dark ? 'light' : 'dark'} />
        </NavigationThemeProvider>
    );
}

function RootLayout() {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        gcTime: PERSIST_MAX_AGE, // 24 hours — must match persistence maxAge
                        retry: 2,
                        refetchOnWindowFocus: false,
                        networkMode: 'offlineFirst',
                    },
                    mutations: {
                        retry: 1,
                        networkMode: 'online',
                    },
                },
            })
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{
                    persister: asyncStoragePersister,
                    maxAge: PERSIST_MAX_AGE,
                    dehydrateOptions: {
                        shouldDehydrateQuery,
                    },
                }}
            >
                <SafeAreaProvider>
                    <ThemeProvider>
                        <BottomSheetModalProvider>
                            <RootLayoutNav />
                            <BadgeCelebrationModal />
                        </BottomSheetModalProvider>
                    </ThemeProvider>
                </SafeAreaProvider>
            </PersistQueryClientProvider>
        </GestureHandlerRootView>
    );
}

export default Sentry.wrap(RootLayout);
