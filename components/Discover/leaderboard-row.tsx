import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { formatDistanceToNow } from 'date-fns';
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

/**
 * Row display type that accepts both leaderboard and personal ranking data.
 * All fields beyond the shared core are optional so both RPC shapes work.
 */
export type LeaderboardEntry = {
    rank: number;
    restaurant_id: string;
    restaurant_name: string;
    neighborhood_name?: string | null;
    city_name?: string;
    address?: string;
    bayesian_score?: number;
    confidence_tier?: string;
    raw_weighted_avg?: number;
    derived_score?: number;
    total_ratings?: number;
    featured_photo_url?: string | null;
    photo_url?: string | null;
    sentiment?: 'liked' | 'okay' | 'disliked';
    variation_name?: string | null;
    rated_at?: string;
};

interface LeaderboardRowProps {
    item: LeaderboardEntry;
    onPress: () => void;
    variant?: 'global' | 'personal';
}

const SENTIMENT_CONFIG: Record<string, { icon: IconSymbolName; color: string; label: string }> = {
    liked: { icon: 'heart', color: '#22c55e', label: 'Liked' },
    okay: { icon: 'thumbs-up', color: '#f59e0b', label: 'Okay' },
    disliked: { icon: 'thumbs-down', color: '#ef4444', label: "Didn't like" },
};

/**
 * Leaderboard row with variant support for global vs personal views
 */
export function LeaderboardRow({ item, onPress, variant = 'global' }: LeaderboardRowProps) {
    const { theme } = useTheme();
    const medal = getMedal(item.rank);
    const isHero = item.rank === 1;
    const styles = createThemedStyles(theme, medal, isHero);

    const sentimentInfo = item.sentiment ? SENTIMENT_CONFIG[item.sentiment] : null;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                pressed && { opacity: 0.8 },
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
            {/* Medal Border for Top 3 */}
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
                {/* Rank Badge */}
                {item.rank !== 1 && <View style={styles.rankContainer}>
                    <ThemedText style={styles.rankText}>
                        {item.rank}
                    </ThemedText>
                </View>}

                {/* Photo */}
                <View style={styles.photoContainer}>
                    {item.featured_photo_url || item.photo_url ? (
                        <Image
                            source={{
                                uri: item.featured_photo_url ?? item.photo_url ?? undefined,
                            }}
                            style={styles.photo}
                            contentFit="cover"
                            transition={150}
                        />
                    ) : (
                        <View style={[styles.photo, styles.photoPlaceholder]}>
                            <IconSymbol
                                name="image-outline"
                                size={isHero ? 32 : 24}
                                color={theme.color.textSecondary}
                            />
                        </View>
                    )}
                </View>

                {/* Restaurant Info */}
                <View style={styles.infoContainer}>
                    <ThemedText style={styles.restaurantName} numberOfLines={1}>
                        {item.restaurant_name}
                    </ThemedText>

                    {variant === 'personal' && sentimentInfo ? (
                        <>
                            {item.variation_name && <ThemedText style={styles.neighborhood} numberOfLines={1}>
                                {item.variation_name}
                            </ThemedText>}
                            <View style={[styles.personalMeta, { marginTop: 0 }]}>
                                <IconSymbol
                                    name={sentimentInfo.icon}
                                    size={12}
                                    color={sentimentInfo.color}
                                />
                                <ThemedText style={[styles.metaText, { color: sentimentInfo.color, fontWeight: '500', flexShrink: 0 }]} numberOfLines={1}>
                                    {sentimentInfo.label}
                                </ThemedText>
                                {item.rated_at ? (
                                    <>
                                        <ThemedText style={styles.metaDot}>·</ThemedText>
                                        <ThemedText style={[styles.metaText, { flexShrink: 0 }]} numberOfLines={1}>
                                            {formatDistanceToNow(new Date(item.rated_at), { addSuffix: false })} ago
                                        </ThemedText>
                                    </>
                                ) : null}
                            </View>
                        </>
                    ) : (
                        <>
                            <ThemedText style={styles.neighborhood} numberOfLines={1}>
                                {item.neighborhood_name ?? item.city_name ?? item.address?.split(',')[1]}
                            </ThemedText>
                            {(item.confidence_tier || item.total_ratings != null) && (
                                <View style={styles.confidenceRow}>
                                    <ThemedText style={styles.ratingCount}>
                                        {item.total_ratings} ratings | Confidence: {item.confidence_tier}
                                    </ThemedText>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Score Badge */}
                <ScoreBadge
                    score={item.bayesian_score ?? item.derived_score ?? item.raw_weighted_avg ?? 0}
                    style={styles.scoreBadge}
                />
            </View>
        </Pressable>
    );
}

export function LeaderboardRowSkeleton() {
    const { theme } = useTheme();
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(0.35, { duration: 750 }), -1, true);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const bg = theme.color.surface2;

    return (
        <Animated.View style={[skeletonStyles.container, { backgroundColor: theme.color.surface }, animStyle]}>
            <View style={skeletonStyles.content}>
                <View style={[skeletonStyles.rank, { backgroundColor: bg }]} />
                <View style={[skeletonStyles.photo, { backgroundColor: bg, borderRadius: theme.radius.sm }]} />
                <View style={skeletonStyles.info}>
                    <View style={[skeletonStyles.nameLine, { backgroundColor: bg, borderRadius: 4 }]} />
                    <View style={[skeletonStyles.subLine, { backgroundColor: bg, borderRadius: 4 }]} />
                </View>
                <View style={[skeletonStyles.score, { backgroundColor: bg, borderRadius: theme.radius.sm }]} />
            </View>
        </Animated.View>
    );
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

function getMedal(rank: number): 'gold' | 'silver' | 'bronze' | undefined {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return undefined;
}

function getMedalGradient(
    medal: 'gold' | 'silver' | 'bronze',
    theme: any
): [string, string] {
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

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    medal?: 'gold' | 'silver' | 'bronze',
    isHero?: boolean
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
            padding: isHero ? theme.space.md : theme.space.sm,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
        },
        rankContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.space.sm,
        },
        crown: {
            fontSize: 28,
        },
        rankText: {
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '600',
            color: theme.color.textPrimary,
            fontVariant: ['tabular-nums'] as any,
        },
        photoContainer: {
            marginRight: theme.space.sm,
        },
        photo: {
            width: isHero ? 96 : 68,
            height: isHero ? 96 : 68,
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
            marginRight: theme.space.xs,
        },
        restaurantName: {
            fontSize: isHero ? theme.font.size.lg : theme.font.size.md,
            fontWeight: isHero ? '800' : '700',
            color: theme.color.textPrimary,
            marginBottom: 2,
        },
        neighborhood: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginBottom: 4,
        },
        confidenceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
        },
        personalMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
        },
        metaText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            flexShrink: 1,
        },
        metaDot: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
        },
        flames: {
            fontSize: 12,
            letterSpacing: 1,
        },
        ratingCount: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            fontVariant: ['tabular-nums'] as any,
        },
        scoreBadge: {
            marginLeft: 'auto',
        },
    });
