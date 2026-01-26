import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useRecentBattles } from '@/hooks/use-recent-battles';
import { makeShadow } from '@/lib/theme/makeStyles';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

const BANNER_HEIGHT = 100;
const ANIMATION_DURATION = 600;
const DISPLAY_DURATION = 5000; // Show each battle for 5 seconds

/**
 * RecentBattleTicker - Notification-style banner showing recent community battles
 *
 * Displays battles in a sleek notification banner with:
 * - Flat, minimal design (not card-based)
 * - Single-line battle summary
 * - Username, winner vs loser, dish type, and timestamp
 * - Smooth vertical content transitions
 *
 * Purpose:
 * - Shows the "Authority Engine" is active
 * - Creates a sense of live community activity
 * - Validates the ranking system
 *
 * Used in: Home screen (between dish type pills and hero card)
 */
export function RecentBattleTicker({ cityId }: RecentBattleTickerProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { data: battles, isLoading } = useRecentBattles({
        limit: 15,
        cityId,
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const battlesLengthRef = useRef(0);

    // Keep ref updated with current battles length
    useEffect(() => {
        battlesLengthRef.current = battles?.length ?? 0;
        // Reset index if it's out of bounds after data changes
        if (battles && currentIndex >= battles.length) {
            setCurrentIndex(0);
        }
    }, [battles, currentIndex]);

    // Advance to next battle (called from interval)
    const advanceToNext = useCallback(() => {
        const length = battlesLengthRef.current;
        if (length === 0) return;

        // Fade out current
        opacity.value = withTiming(0, {
            duration: 200,
            easing: Easing.ease,
        });

        // Slide up current
        translateY.value = withTiming(-BANNER_HEIGHT, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });

        // After exit animation, update index and animate in
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % length);
            translateY.value = BANNER_HEIGHT;

            // Slide in from bottom
            translateY.value = withDelay(
                50,
                withTiming(0, {
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.cubic),
                })
            );

            // Fade in
            opacity.value = withDelay(
                100,
                withTiming(1, { duration: 300, easing: Easing.ease })
            );
        }, ANIMATION_DURATION);
    }, [opacity, translateY]);

    // Auto-advance through battles
    useEffect(() => {
        if (!battles || battles.length === 0) return;

        const interval = setInterval(advanceToNext, DISPLAY_DURATION);
        return () => clearInterval(interval);
    }, [battles, advanceToNext]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (isLoading || !battles || battles.length === 0) {
        return null;
    }

    const currentBattle = battles[currentIndex % battles.length];
    if (!currentBattle) {
        return null;
    }

    const timeAgo = formatDistanceToNow(new Date(currentBattle.createdAt), {
        addSuffix: false,
    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.bannerWrapper}>
                <View style={styles.innerContainer}>
                    <Animated.View style={[styles.contentRow, animatedStyle]}>
                        {/* Left: Activity icon */}
                        <View style={styles.iconContainer}>
                            <IconSymbol
                                name="trophy-outline"
                                size={20}
                                color={theme.color.accent}
                            />
                        </View>

                        {/* Center: Battle text */}
                        <View style={styles.textContainer}>
                            <ThemedText
                                style={styles.primaryText}
                                numberOfLines={2}
                            >
                                <ThemedText style={styles.username}>
                                    {currentBattle.username}
                                </ThemedText>
                                <ThemedText style={styles.action}>
                                    {' '}
                                    picked{' '}
                                </ThemedText>
                                <ThemedText style={styles.winner}>
                                    {currentBattle.winnerRestaurant}
                                </ThemedText>
                                <ThemedText style={styles.action}>
                                    {' '}
                                    over{' '}
                                </ThemedText>
                                <ThemedText style={styles.loser}>
                                    {currentBattle.loserRestaurant}
                                </ThemedText>
                            </ThemedText>
                            <View style={styles.bottomTextContainer}>
                                <ThemedText style={styles.secondaryText}>
                                    {currentBattle.dishTypeEmoji}{' '}
                                    {currentBattle.dishTypeName}
                                </ThemedText>
                                <ThemedText style={styles.timestamp}>
                                    {timeAgo}
                                </ThemedText>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: theme.space.md,
            marginVertical: theme.space.lg,
        },
        bannerWrapper: {
            ...makeShadow(theme, 'md'),
            height: BANNER_HEIGHT,
            borderRadius: theme.radius.md,
            backgroundColor:
                theme.mode === 'dark'
                    ? theme.color.surface
                    : theme.color.surface,
            borderWidth: 1,
            borderColor:
                theme.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
        },
        innerContainer: {
            flex: 1,
            overflow: 'hidden',
            borderRadius: theme.radius.md,
        },
        contentRow: {
            height: BANNER_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.sm,
            gap: theme.space.sm,
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor:
                theme.mode === 'dark'
                    ? theme.color.accentSoft
                    : theme.color.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        textContainer: {
            flex: 1,
            justifyContent: 'center',
            gap: 2,
        },
        primaryText: {
            fontSize: theme.font.size.sm,
            lineHeight: 18,
        },
        username: {
            fontWeight: '700',
            color: theme.color.textPrimary,
        },
        action: {
            fontWeight: '400',
            color: theme.color.textSecondary,
        },
        winner: {
            fontWeight: '700',
            color: theme.color.textPrimary,
        },
        loser: {
            fontWeight: '500',
            color: theme.color.textTertiary,
        },
        bottomTextContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        secondaryText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            fontWeight: '500',
        },
        timestamp: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            fontWeight: '500',
            textAlign: 'right',
        },
    });
