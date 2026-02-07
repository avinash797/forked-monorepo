import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

// Type matching the get_leaderboard_with_tiebreakers RPC return
export interface LeaderboardEntry {
    rank: number;
    restaurant_id: string;
    restaurant_name: string;
    neighborhood_name?: string;
    city_name?: string;
    global_elo?: number;
    personal_elo?: number;
    avg_raw_score?: number;
    raw_score?: number;
    confidence_score?: number;
    total_battles?: number;
    battles_total?: number;
    total_ratings?: number;
    win_rate?: number;
    featured_photo_url?: string | null;
    photo_url?: string;
}

interface LeaderboardRowProps {
    item: LeaderboardEntry;
    onPress: () => void;
}

/**
 * Leaderboard row for v0.1 with confidence meter and clean layout
 */
export function LeaderboardRow({ item, onPress }: LeaderboardRowProps) {
    const { theme } = useTheme();
    const medal = getMedal(item.rank);
    const styles = createThemedStyles(theme, medal);

    // Confidence flames based on confidence_score (0-100)
    const confidenceLevel = item.confidence_score
        ? Math.min(5, Math.max(1, Math.ceil(item.confidence_score / 20)))
        : 0;
    const flames = Array(confidenceLevel).fill('🔥').join('');

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
                <View style={styles.rankContainer}>
                    {item.rank === 1 ? (
                        <ThemedText style={styles.crown}>👑</ThemedText>
                    ) : (
                        <View style={styles.rankBadge}>
                            <ThemedText style={styles.rankText}>
                                {item.rank}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Photo */}
                <View style={styles.photoContainer}>
                    {item.featured_photo_url || item.photo_url ? (
                        <Image
                            source={{
                                uri: item.featured_photo_url || item.photo_url,
                            }}
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

                {/* Restaurant Info */}
                <View style={styles.infoContainer}>
                    <ThemedText style={styles.restaurantName} numberOfLines={1}>
                        {item.restaurant_name}
                    </ThemedText>
                    <ThemedText style={styles.neighborhood} numberOfLines={1}>
                        {item.neighborhood_name ?? item.city_name}
                    </ThemedText>
                    <View style={styles.confidenceRow}>
                        <ThemedText style={styles.flames}>{flames}</ThemedText>
                        <ThemedText style={styles.battleCount}>
                            {item.battles_total} battles
                        </ThemedText>
                    </View>
                </View>

                {/* Score Badge */}
                <ScoreBadge
                    score={item.avg_raw_score ?? item.raw_score ?? 0}
                    style={styles.scoreBadge}
                />
            </View>
        </Pressable>
    );
}

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
    medal?: 'gold' | 'silver' | 'bronze'
) =>
    StyleSheet.create({
        container: {
            marginBottom: medal ? theme.space.md : theme.space.sm,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            overflow: medal ? 'visible' : 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: medal ? 4 : 1 },
            shadowOpacity: medal ? 0.2 : 0.08,
            shadowRadius: medal ? 6 : 2,
            elevation: medal ? 6 : 2,
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
            padding: theme.space.sm,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
        },
        rankContainer: {
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.space.sm,
        },
        crown: {
            fontSize: 28,
        },
        rankBadge: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.color.surface2,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rankText: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.color.textSecondary,
        },
        photoContainer: {
            marginRight: theme.space.sm,
        },
        photo: {
            width: 64,
            height: 64,
            borderRadius: theme.radius.md,
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
            fontSize: theme.font.size.md,
            fontWeight: '700',
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
        flames: {
            fontSize: 12,
            letterSpacing: 1,
        },
        battleCount: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
        },
        scoreBadge: {
            marginLeft: 'auto',
        },
    });
