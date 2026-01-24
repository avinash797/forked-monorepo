import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useRecentBattles } from '@/hooks/use-recent-battles';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

interface RecentBattleTickerProps {
    cityId?: string;
}

const CARD_HEIGHT = 100; // Increased height for more details
const ANIMATION_DURATION = 800;
const DISPLAY_DURATION = 3000; // Show each battle for 3 seconds

/**
 * RecentBattleTicker - Vertical rolling ticker showing recent community battles
 *
 * Displays battles in a smooth vertical carousel with:
 * - Winner vs Loser layout with visual distinction
 * - Dish type emoji and name
 * - Timestamp (e.g., "2m ago")
 * - Smooth reanimated transitions
 *
 * Purpose:
 * - Shows the "Authority Engine" is active
 * - Creates a sense of community
 * - Validates the ranking system with real activity
 *
 * Used in: Home screen (between dish type pills and hero card)
 */
export function RecentBattleTicker({ cityId }: RecentBattleTickerProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { data: battles, isLoading } = useRecentBattles({ limit: 15, cityId });

    const [currentIndex, setCurrentIndex] = useState(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    // Auto-advance through battles
    useEffect(() => {
        if (!battles || battles.length === 0) return;

        const interval = setInterval(() => {
            // Fade out
            opacity.value = withTiming(0, { duration: 300, easing: Easing.ease });

            // Slide up
            translateY.value = withTiming(
                -CARD_HEIGHT,
                { duration: ANIMATION_DURATION, easing: Easing.out(Easing.exp) },
                () => {
                    // After animation, update index and reset position
                    setCurrentIndex((prev) => (prev + 1) % battles.length);
                    translateY.value = CARD_HEIGHT;

                    // Slide in from bottom with delay
                    translateY.value = withDelay(
                        100,
                        withTiming(0, {
                            duration: ANIMATION_DURATION,
                            easing: Easing.out(Easing.exp),
                        })
                    );

                    // Fade in with delay
                    opacity.value = withDelay(
                        200,
                        withTiming(1, { duration: 400, easing: Easing.ease })
                    );
                }
            );
        }, DISPLAY_DURATION);

        return () => clearInterval(interval);
    }, [battles, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (isLoading || !battles || battles.length === 0) {
        return null;
    }

    const currentBattle = battles[currentIndex];
    const timeAgo = formatDistanceToNow(new Date(currentBattle.createdAt), {
        addSuffix: true,
    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.tickerWrapper}>
                <Animated.View style={[styles.battleCard, animatedStyle]}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.userBadge}>
                            <IconSymbol
                                name="person-outline"
                                size={14}
                                color={theme.color.accent}
                            />
                            <ThemedText style={styles.username}>
                                {currentBattle.username}
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.timeAgo}>{timeAgo}</ThemedText>
                    </View>

                    {/* Battle Content */}
                    <View style={styles.battleContent}>
                        {/* Winner Side */}
                        <View style={styles.winnerSide}>
                            <View style={styles.winnerBadge}>
                                <IconSymbol
                                    name="checkmark-circle"
                                    size={16}
                                    color={theme.color.success}
                                />
                            </View>
                            <ThemedText
                                style={styles.winnerName}
                                numberOfLines={2}
                            >
                                {currentBattle.winnerRestaurant}
                            </ThemedText>
                        </View>

                        {/* VS Divider */}
                        <View style={styles.vsDivider}>
                            <ThemedText style={styles.vsText}>VS</ThemedText>
                            <View style={styles.vsLine} />
                        </View>

                        {/* Loser Side */}
                        <View style={styles.loserSide}>
                            <View style={styles.loserBadge}>
                                <IconSymbol
                                    name="close-circle-outline"
                                    size={16}
                                    color={theme.color.textTertiary}
                                />
                            </View>
                            <ThemedText
                                style={styles.loserName}
                                numberOfLines={2}
                            >
                                {currentBattle.loserRestaurant}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Footer Row - Dish Type */}
                    <View style={styles.footerRow}>
                        <View style={styles.dishTypeBadge}>
                            <ThemedText style={styles.dishTypeEmoji}>
                                {currentBattle.dishTypeEmoji}
                            </ThemedText>
                            <ThemedText style={styles.dishTypeName}>
                                {currentBattle.dishTypeName}
                            </ThemedText>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                {battles.slice(0, 5).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.progressDot,
                            index === currentIndex % 5 && styles.progressDotActive,
                        ]}
                    />
                ))}
            </View>
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginBottom: theme.space.md,
            paddingHorizontal: theme.space.md,
        },
        tickerWrapper: {
            height: CARD_HEIGHT,
            overflow: 'hidden',
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        battleCard: {
            height: CARD_HEIGHT,
            padding: theme.space.sm,
            justifyContent: 'space-between',
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        userBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            backgroundColor: theme.color.accentSoft,
            paddingHorizontal: theme.space.xs,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
        },
        username: {
            fontSize: theme.font.size.xs,
            fontWeight: '600',
            color: theme.color.accent,
        },
        timeAgo: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            fontWeight: '500',
        },
        battleContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: theme.space.xs,
        },
        winnerSide: {
            flex: 1,
            alignItems: 'flex-start',
        },
        winnerBadge: {
            marginBottom: 2,
        },
        winnerName: {
            fontSize: theme.font.size.md,
            fontWeight: '700',
            color: theme.color.textPrimary,
            lineHeight: 18,
        },
        vsDivider: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: theme.space.xs,
        },
        vsText: {
            fontSize: theme.font.size.xs,
            fontWeight: '800',
            color: theme.color.textTertiary,
            letterSpacing: 1,
            marginBottom: 2,
        },
        vsLine: {
            width: 1,
            height: 24,
            backgroundColor: theme.color.border,
        },
        loserSide: {
            flex: 1,
            alignItems: 'flex-end',
        },
        loserBadge: {
            marginBottom: 2,
        },
        loserName: {
            fontSize: theme.font.size.sm,
            fontWeight: '500',
            color: theme.color.textSecondary,
            opacity: 0.7,
            lineHeight: 16,
            textAlign: 'right',
        },
        footerRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: theme.space.xs,
        },
        dishTypeBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
            paddingHorizontal: theme.space.sm,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
        },
        dishTypeEmoji: {
            fontSize: 14,
        },
        dishTypeName: {
            fontSize: theme.font.size.sm,
            fontWeight: '600',
            color: theme.color.textSecondary,
        },
        progressContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: theme.space.xxs,
            marginTop: theme.space.sm,
        },
        progressDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.color.border,
        },
        progressDotActive: {
            backgroundColor: theme.color.accent,
            width: 20,
        },
    });
