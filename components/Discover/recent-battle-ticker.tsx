import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useRecentBattles } from '@/hooks/use-recent-battles';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface RecentBattleTickerProps {
    cityId?: string;
}

/**
 * RecentBattleTicker - Auto-scrolling ticker showing recent community battles
 *
 * Displays: "User123 picked **Parkway** over **Domilise's** (🥖 Po'boy) • 2m ago"
 *
 * Purpose:
 * - Shows the "Authority Engine" is active
 * - Creates a sense of community
 * - Validates the ranking system with real activity
 *
 * Used in: Home screen (between header and hero card)
 */
export function RecentBattleTicker({ cityId }: RecentBattleTickerProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { data: battles, isLoading } = useRecentBattles({ limit: 15, cityId });

    const scrollX = useRef(new Animated.Value(0)).current;

    // Auto-scroll animation
    useEffect(() => {
        if (!battles || battles.length === 0) return;

        const scrollAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scrollX, {
                    toValue: -1000, // Scroll left
                    duration: 20000, // 20 seconds
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scrollX, {
                    toValue: 0, // Reset
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );

        scrollAnimation.start();

        return () => scrollAnimation.stop();
    }, [battles, scrollX]);

    if (isLoading || !battles || battles.length === 0) {
        return null;
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.tickerContainer}>
                <Animated.View
                    style={[
                        styles.tickerContent,
                        {
                            transform: [{ translateX: scrollX }],
                        },
                    ]}
                >
                    {battles.slice(0, 5).map((battle, index) => {
                        const timeAgo = formatDistanceToNow(
                            new Date(battle.createdAt),
                            { addSuffix: false }
                        );

                        return (
                            <View key={battle.id} style={styles.battleItem}>
                                <ThemedText style={styles.battleText}>
                                    <ThemedText
                                        style={styles.username}
                                        numberOfLines={1}
                                    >
                                        {battle.username}
                                    </ThemedText>
                                    <ThemedText style={styles.action}>
                                        {' '}
                                        picked{' '}
                                    </ThemedText>
                                    <ThemedText
                                        style={styles.winner}
                                        numberOfLines={1}
                                    >
                                        {battle.winnerRestaurant}
                                    </ThemedText>
                                    <ThemedText style={styles.action}>
                                        {' '}
                                        over{' '}
                                    </ThemedText>
                                    <ThemedText
                                        style={styles.loser}
                                        numberOfLines={1}
                                    >
                                        {battle.loserRestaurant}
                                    </ThemedText>
                                    <ThemedText style={styles.dishType}>
                                        {' '}
                                        ({battle.dishTypeEmoji}{' '}
                                        {battle.dishTypeName})
                                    </ThemedText>
                                    <ThemedText style={styles.timeAgo}>
                                        {' '}
                                        • {timeAgo}
                                    </ThemedText>
                                </ThemedText>
                                {index < battles.slice(0, 5).length - 1 && (
                                    <ThemedText style={styles.separator}>
                                        {' '}
                                        •{' '}
                                    </ThemedText>
                                )}
                            </View>
                        );
                    })}
                </Animated.View>
            </View>
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            paddingVertical: theme.space.sm,
            backgroundColor: theme.color.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.color.border,
            overflow: 'hidden',
            marginBottom: theme.space.md,
        },
        tickerContainer: {
            flexDirection: 'row',
            overflow: 'hidden',
        },
        tickerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
        },
        battleItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: theme.space.lg,
        },
        battleText: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'nowrap',
        },
        username: {
            color: theme.color.accent,
            fontSize: theme.font.size.sm,
            fontWeight: '600',
        },
        action: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            fontWeight: '400',
        },
        winner: {
            color: theme.color.textPrimary,
            fontSize: theme.font.size.sm,
            fontWeight: '700',
        },
        loser: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            fontWeight: '500',
            textDecorationLine: 'line-through',
        },
        dishType: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            fontWeight: '400',
            fontStyle: 'italic',
        },
        timeAgo: {
            color: theme.color.textTertiary,
            fontSize: theme.font.size.xs,
            fontWeight: '400',
        },
        separator: {
            color: theme.color.textTertiary,
            fontSize: theme.font.size.sm,
            marginHorizontal: theme.space.xs,
        },
    });
