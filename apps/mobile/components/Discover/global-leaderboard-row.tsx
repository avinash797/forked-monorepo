import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import type { LeaderboardEntry } from '@forked/supabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Text as SvgText } from 'react-native-svg';

interface GlobalLeaderboardRowProps {
    item: LeaderboardEntry;
    onPress: () => void;
}

type Medal = 'gold' | 'silver' | 'bronze';

/**
 * Row for the global (community) leaderboard — ranks by Bayesian score
 * and shows confidence tier + total ratings.
 */
export function GlobalLeaderboardRow({
    item,
    onPress,
}: GlobalLeaderboardRowProps) {
    const { theme } = useTheme();
    const medal = getMedal(item.rank);
    const styles = createThemedStyles(theme, medal);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                pressed && { opacity: 0.8 },
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
            {medal && (
                <View style={styles.medalBorder}>
                    <LinearGradient
                        colors={getMedalGradient(medal, theme)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
            )}

            <View style={styles.content}>
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <Svg width="40" height="70">
                        {/* Stroke layer */}
                        <SvgText
                            x="20"
                            y="30%"
                            textAnchor="middle"
                            alignmentBaseline="central"
                            stroke={theme.color.accent}
                            strokeWidth="6"
                            strokeLinejoin="round"
                            fontSize={40}
                            fontWeight="900"
                        >
                            {item.rank}
                        </SvgText>
                        {/* Fill layer */}
                        <SvgText
                            x="20"
                            y="30%"
                            textAnchor="middle"
                            alignmentBaseline="central"
                            fill={'#fff'}
                            fontSize={40}
                            fontWeight="900"
                            strokeWidth={0}
                        >
                            {item.rank}
                        </SvgText>
                    </Svg>
                </View>

                <View style={styles.photoContainer}>
                    {item.featured_photo_url ? (
                        <Image
                            source={{ uri: item.featured_photo_url }}
                            style={styles.photo}
                            contentFit="cover"
                            transition={150}
                        />
                    ) : (
                        <View style={[styles.photo, styles.photoPlaceholder]}>
                            <IconSymbol
                                name="image-outline"
                                size={24}
                                color={theme.color.textSecondary}
                            />
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <ThemedText style={styles.restaurantName} numberOfLines={1}>
                        {item.restaurant_name}
                    </ThemedText>

                    <ThemedText style={styles.neighborhood} numberOfLines={1}>
                        <IconSymbol
                            name="pin"
                            size={14}
                            color={theme.color.textSecondary}
                        />
                        {item.neighborhood_name ?? item.address?.split(',')[1]}
                    </ThemedText>

                    {(item.confidence_tier || item.total_ratings != null) && (
                        <View style={styles.personalMeta}>
                            <ThemedText
                                style={styles.metaText}
                                numberOfLines={1}
                            >
                                {item.total_ratings} ratings
                            </ThemedText>
                            <ThemedText style={styles.metaDot}>·</ThemedText>
                            <ThemedText
                                style={styles.metaText}
                                numberOfLines={1}
                            >
                                Confidence: {item.confidence_tier}
                            </ThemedText>
                            <ScoreBadge
                                score={item.bayesian_score ?? 0}
                                style={styles.scoreBadge}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

export function GlobalLeaderboardRowSkeleton() {
    const { theme } = useTheme();
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.35, { duration: 750 }),
            -1,
            true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const bg = theme.color.surface2;

    return (
        <Animated.View
            style={[
                skeletonStyles.container,
                { backgroundColor: theme.color.surface },
                animStyle,
            ]}
        >
            <View style={skeletonStyles.content}>
                <View style={[skeletonStyles.rank, { backgroundColor: bg }]} />
                <View
                    style={[
                        skeletonStyles.photo,
                        { backgroundColor: bg, borderRadius: theme.radius.sm },
                    ]}
                />
                <View style={skeletonStyles.info}>
                    <View
                        style={[
                            skeletonStyles.nameLine,
                            { backgroundColor: bg, borderRadius: 4 },
                        ]}
                    />
                    <View
                        style={[
                            skeletonStyles.subLine,
                            { backgroundColor: bg, borderRadius: 4 },
                        ]}
                    />
                </View>
                <View
                    style={[
                        skeletonStyles.score,
                        { backgroundColor: bg, borderRadius: theme.radius.sm },
                    ]}
                />
            </View>
        </Animated.View>
    );
}

function getMedal(rank: number): Medal | undefined {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return undefined;
}

function getMedalGradient(medal: Medal, theme: any): [string, string] {
    const colors = {
        gold: theme.color.gold ?? '#FFD700',
        silver: theme.color.silver ?? '#C0C0C0',
        bronze: theme.color.bronze ?? '#CD7F32',
    };
    return [colors[medal], adjustBrightness(colors[medal], 1.2)];
}

function adjustBrightness(color: string, factor: number): string {
    const hex = color?.replace('#', '') || '000000';
    const r = Math.min(
        255,
        Math.round(parseInt(hex.substring(0, 2), 16) * factor)
    );
    const g = Math.min(
        255,
        Math.round(parseInt(hex.substring(2, 4), 16) * factor)
    );
    const b = Math.min(
        255,
        Math.round(parseInt(hex.substring(4, 6), 16) * factor)
    );
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const skeletonStyles = StyleSheet.create({
    container: {
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 10,
    },
    rank: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    photo: {
        width: 68,
        height: 68,
    },
    info: {
        flex: 1,
        gap: 8,
    },
    nameLine: {
        height: 14,
        width: '75%',
    },
    subLine: {
        height: 11,
        width: '50%',
    },
    score: {
        width: 44,
        height: 44,
    },
});

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    medal?: Medal
) =>
    StyleSheet.create({
        container: {
            marginBottom: medal ? theme.space.md : theme.space.sm,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface,
            overflow: medal ? 'visible' : 'hidden',
            boxShadow: medal
                ? '0px 4px 6px rgba(0, 0, 0, 0.2)'
                : '0px 1px 2px rgba(0, 0, 0, 0.08)',
        },
        medalBorder: {
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: theme.radius.lg + 2,
            overflow: 'hidden',
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            gap: theme.space.sm,
            position: 'relative',
            paddingLeft: theme.space.xs,
            paddingVertical: theme.space.xs,
        },
        photoContainer: {
            zIndex: 1,
        },
        rankText: {
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '600',
            color: theme.color.textPrimary,
            fontVariant: ['tabular-nums'] as any,
        },
        photo: {
            width: 90,
            height: 90,
            borderRadius: theme.radius.sm,
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface2,
        },
        photoPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        infoContainer: {
            flex: 1,
            justifyContent: 'center',
            paddingVertical: theme.space.xxs,
            paddingRight: theme.space.xs,
        },
        restaurantName: {
            fontSize: theme.font.size.md + 1,
            fontWeight: '700',
            color: theme.color.textPrimary,
            letterSpacing: -0.3,
        },
        neighborhood: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
            fontWeight: '500',
        },
        personalMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        metaText: {
            fontSize: theme.font.size.sm - 1,
            color: theme.color.textSecondary,
            flexShrink: 1,
        },
        metaDot: {
            fontSize: theme.font.size.sm - 1,
            color: theme.color.textTertiary,
        },
        scoreBadge: {
            marginLeft: 'auto',
        },
    });
