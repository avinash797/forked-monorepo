import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import type { LeaderboardItem as LeaderboardItemType } from '@/types/browse';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

interface LeaderboardItemProps {
    item: LeaderboardItemType;
    onPress: () => void;
}

/**
 * Dramatic, playful leaderboard item component
 */
export function LeaderboardItem({ item, onPress }: LeaderboardItemProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, item.medal);

    const hasPhoto = item.dish.photos && item.dish.photos.length > 0;
    const photoUrl = hasPhoto ? item.dish.photos?.[0] : null;

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
            {item.medal && (
                <View style={styles.medalBorder}>
                    <LinearGradient
                        colors={getMedalGradient(item.medal, theme)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
            )}

            <View style={styles.content}>
                {/* Crown only for #1 */}
                {item.rank === 1 && (
                    <ThemedText style={styles.crown}>👑</ThemedText>
                )}

                {/* Dish Photo - Oversized for Top 3 */}
                <View
                    style={[
                        styles.photoContainer,
                        item.medal && styles.photoContainerOversized,
                    ]}
                >
                    {photoUrl ? (
                        <Image
                            source={{ uri: photoUrl }}
                            style={[
                                styles.photo,
                                item.medal && styles.photoOversized,
                            ]}
                            contentFit="cover"
                            transition={150}
                        />
                    ) : (
                        <View
                            style={[
                                styles.photo,
                                item.medal && styles.photoOversized,
                                { backgroundColor: theme.color.surface2 },
                            ]}
                        />
                    )}
                </View>

                {/* Dish & Venue Info */}
                <View style={styles.infoContainer}>
                    <ThemedText style={styles.dishName} numberOfLines={1}>
                        {item.dish.name}
                    </ThemedText>
                    <ThemedText style={styles.venueName} numberOfLines={1}>
                        {item.venue.name}
                    </ThemedText>
                    <View style={styles.metaRow}>
                        {item.dish.current_price && (
                            <ThemedText style={styles.price}>
                                ${item.dish.current_price.toFixed(0)}
                            </ThemedText>
                        )}
                        <ThemedText style={styles.reviewCount}>
                            {item.dish.review_count}{' '}
                            {item.dish.review_count === 1
                                ? 'review'
                                : 'reviews'}
                        </ThemedText>
                    </View>
                </View>

                {/* Rating Badge */}
                {item.dish.average_rating !== null && (
                    <ScoreBadge
                        score={item.dish.average_rating}
                        style={styles.scoreBadge}
                    />
                )}
            </View>
        </Pressable>
    );
}

/**
 * Get gradient colors for medal borders using new theme tokens
 */
function getMedalGradient(
    medal: 'gold' | 'silver' | 'bronze',
    theme: any
): [string, string] {
    switch (medal) {
        case 'gold':
            return [theme.color.gold, adjustBrightness(theme.color.gold, 1.2)];
        case 'silver':
            return [
                theme.color.silver,
                adjustBrightness(theme.color.silver, 1.15),
            ];
        case 'bronze':
            return [
                theme.color.bronze,
                adjustBrightness(theme.color.bronze, 1.15),
            ];
        default:
            return ['#000', '#000'];
    }
}

/**
 * Adjust color brightness for gradient effect
 */
function adjustBrightness(color: string, factor: number): string {
    const hex = color?.replace('#', '');
    const r = Math.min(
        255,
        Math.round(parseInt(hex?.substring(0, 2), 16) * factor)
    );
    const g = Math.min(
        255,
        Math.round(parseInt(hex?.substring(2, 4), 16) * factor)
    );
    const b = Math.min(
        255,
        Math.round(parseInt(hex?.substring(4, 6), 16) * factor)
    );
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    medal?: 'gold' | 'silver' | 'bronze'
) =>
    StyleSheet.create({
        container: {
            marginBottom: medal ? theme.space.md + 4 : theme.space.sm,
            marginTop: medal ? 8 : 0,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            overflow: medal ? 'visible' : 'hidden',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: medal ? 6 : 1,
            },
            shadowOpacity: medal ? 0.25 : 0.08,
            shadowRadius: medal ? 8 : 2,
            elevation: medal ? 8 : 2,
            zIndex: medal ? 10 : 1,
        },
        medalBorder: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 3,
            zIndex: -1,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            backgroundColor: theme.color.surface,
            margin: medal ? 3 : 0,
            borderRadius: medal ? theme.radius.lg - 3 : theme.radius.lg,
            overflow: medal ? 'visible' : 'hidden',
            position: 'relative',
        },

        crown: {
            fontSize: 45,
            position: 'absolute',
            top: -8,
            left: -8,
            transform: [{ rotate: '-20deg' }],
            zIndex: 20,
        },
        photoContainer: {
            marginRight: theme.space.sm,
            zIndex: 15,
        },
        photoContainerOversized: {
            marginRight: theme.space.md,
            position: 'absolute',
            left: 0,
            top: 0,
            transform: [{ rotate: '-5deg' }],
        },
        photo: {
            width: 64,
            height: 64,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface2,
        },
        photoOversized: {
            width: 110,
            height: 110,
            borderRadius: theme.radius.md,
            marginTop: -12,
            marginBottom: -12,
            marginLeft: -10,
            borderWidth: 2,
            borderColor: theme.color.textPrimary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
        },
        infoContainer: {
            flex: 1,
            justifyContent: 'center',
            marginRight: theme.space.xs,
            paddingLeft: medal ? theme.space.xxl + 72 : theme.space.sm,
        },
        dishName: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            marginBottom: 2,
        },
        venueName: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginBottom: 4,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
        },
        price: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.bold,
            color: theme.color.accent,
        },
        reviewCount: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
        },
        scoreBadge: {
            // Sizing handled by component
        },
    });
