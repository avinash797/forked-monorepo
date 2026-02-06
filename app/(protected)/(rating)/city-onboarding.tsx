import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { supabase } from '@/lib/supabase';
import { useRatingStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOADING_MESSAGES = [
    { emoji: '🔍', text: 'Discovering local favorites...' },
    { emoji: '🍽️', text: 'Finding signature dishes...' },
    { emoji: '👨‍🍳', text: 'Asking the locals what\u2019s good...' },
    { emoji: '📍', text: 'Mapping the food scene...' },
    { emoji: '✨', text: 'Almost there...' },
];

const MESSAGE_INTERVAL_MS = 3000;

export default function CityOnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const { newCityInfo } = useRatingStore();
    const [messageIndex, setMessageIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const hasStarted = useRef(false);

    const styles = createThemedStyles(theme, insets);

    // Cycle through loading messages
    useEffect(() => {
        if (error) return;
        const interval = setInterval(() => {
            setMessageIndex((prev) =>
                prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
            );
        }, MESSAGE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [error]);

    // Guard: if no city info, skip straight to dish selection
    useEffect(() => {
        if (!newCityInfo) {
            router.replace('/(protected)/(rating)/dish-selection');
        }
    }, [newCityInfo, router]);

    const enrichCity = useCallback(async () => {
        if (!newCityInfo || hasStarted.current) return;
        hasStarted.current = true;

        try {
            const { error: fnError } = await supabase.functions.invoke(
                'enrich-city-dish-types',
                {
                    body: {
                        city_id: newCityInfo.cityId,
                        city_name: newCityInfo.cityName,
                        state: newCityInfo.state,
                        country: newCityInfo.country,
                    },
                }
            );

            if (fnError) throw fnError;

            // Invalidate dish types cache so dish-selection sees newly created types
            await queryClient.invalidateQueries({ queryKey: ['dishTypes'] });

            router.replace('/(protected)/(rating)/dish-selection');
        } catch (err) {
            console.error('City enrichment failed:', err);
            setError('Something went wrong, but you can still continue.');
        }
    }, [newCityInfo, queryClient, router]);

    // Trigger enrichment on mount
    useEffect(() => {
        enrichCity();
    }, [enrichCity]);

    const handleContinueAnyway = () => {
        queryClient.invalidateQueries({ queryKey: ['dishTypes'] });
        router.replace('/(protected)/(rating)/dish-selection');
    };

    if (!newCityInfo) return null;

    const currentMessage = LOADING_MESSAGES[messageIndex];

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <Animated.View
                    entering={FadeInDown.duration(600)}
                    style={styles.header}
                >
                    <ThemedText style={styles.cityName}>
                        Welcome to {newCityInfo.cityName}!
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Looks like you're the first here. Setting up the food
                        scene for {newCityInfo.cityName}.
                    </ThemedText>
                </Animated.View>

                <Animated.View
                    key={messageIndex}
                    entering={FadeIn.duration(400)}
                    style={styles.messageContainer}
                >
                    <ThemedText style={styles.emoji}>
                        {currentMessage.emoji}
                    </ThemedText>
                    <ThemedText style={styles.messageText}>
                        {currentMessage.text}
                    </ThemedText>
                </Animated.View>

                {!error && (
                    <ActivityIndicator
                        size="large"
                        color={theme.color.accent}
                    />
                )}

                {error && (
                    <Animated.View entering={FadeIn.duration(400)}>
                        <ThemedText style={styles.errorText}>
                            {error}
                        </ThemedText>
                        <ThemedButton
                            variant="secondary"
                            onPress={handleContinueAnyway}
                            style={styles.continueButton}
                        >
                            Continue
                        </ThemedButton>
                    </Animated.View>
                )}
            </View>
        </ThemedView>
    );
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: { top: number; bottom: number }
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.xl,
            gap: theme.space.xl,
        },
        header: {
            alignItems: 'center',
            gap: theme.space.sm,
        },
        cityName: {
            fontSize: theme.font.size.xxl,
            fontWeight: '700',
            color: theme.color.textPrimary,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            textAlign: 'center',
            lineHeight: theme.font.size.md * 1.5,
        },
        messageContainer: {
            alignItems: 'center',
            gap: theme.space.sm,
            minHeight: 80,
            justifyContent: 'center',
        },
        emoji: {
            fontSize: 40,
        },
        messageText: {
            fontSize: theme.font.size.lg,
            color: theme.color.textSecondary,
            textAlign: 'center',
        },
        errorText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            textAlign: 'center',
            marginBottom: theme.space.md,
        },
        continueButton: {
            alignSelf: 'center',
        },
    });
