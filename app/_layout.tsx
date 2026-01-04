import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
    ThemeProvider as NavigationThemeProvider,
    type Theme as NavigationTheme,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemeProvider, useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';

if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../reactotronConfig');
}

function RootLayoutNav() {
    const { isAuthenticated, isLoading } = useAuth();
    const { theme, isDark } = useTheme();
    const segments = useSegments();
    const router = useRouter();

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
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to onboarding if not authenticated
            router.replace('/(auth)');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to tabs if authenticated
            router.replace('/(protected)/(tabs)');
        }
    }, [isAuthenticated, isLoading, segments]);

    // Show loading screen while checking auth state
    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.color.accent} />
            </ThemedView>
        );
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
            <StatusBar style="auto" />
        </NavigationThemeProvider>
    );
}

export default function RootLayout() {
    const queryClient = new QueryClient();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider>
                    <ThemeProvider>
                        <BottomSheetModalProvider>
                            <RootLayoutNav />
                        </BottomSheetModalProvider>
                    </ThemeProvider>
                </SafeAreaProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
