import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import type { DishWithVenue } from '@/types/browse';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

interface CompactDishCardWithRatingProps {
    dish: DishWithVenue;
    onPress: () => void;
    showVenue?: boolean;
}

/**
 * Enhanced dish card component that displays rating and review count
 * Photo dominating design with text overlay
 * Uses 0-10 numeric rating scale (NOT stars)
 * Used in: search results
 */
export function CompactDishCardWithRating({
    dish,
    onPress,
}: CompactDishCardWithRatingProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const hasPhoto = dish.photos && dish.photos.length > 0;
    const photoUrl = hasPhoto ? dish.photos[0] : null;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.9 }
            ]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
        >
            <View style={styles.content}>
                {/* Background Image */}
                {photoUrl ? (
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.photo}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={[styles.photo, { backgroundColor: theme.color.surface }]} />
                )}

                {/* Dish & Venue Info */}
                <View style={styles.infoContainer}>
                    <ThemedText
                        style={styles.dishName}
                        numberOfLines={1}
                    >
                        {dish.name}
                    </ThemedText>
                    <ThemedText style={styles.venueName} numberOfLines={1}>
                        {dish.venue?.name}
                    </ThemedText>
                    <View style={styles.metaRow}>
                        {dish.current_price && (
                            <ThemedText style={styles.price}>
                                ${dish.current_price.toFixed(0)}
                            </ThemedText>
                        )}
                        <ThemedText style={styles.reviewCount}>
                            {dish.review_count} {dish.review_count === 1 ? 'review' : 'reviews'}
                        </ThemedText>
                    </View>
                </View>

                {/* Rating Badge */}
                {dish.average_rating !== null && (
                    <ScoreBadge
                        score={dish.average_rating}
                    />
                )}
            </View>
        </Pressable>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        card: {
            marginBottom: theme.space.sm,
            marginTop: 0,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
            zIndex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.sm,
            backgroundColor: theme.color.surface,
            margin: 0,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
        },
        photo: {
            width: 64,
            height: 64,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface2,
            marginRight: theme.space.sm,

        },
        infoContainer: {
            flex: 1,
            justifyContent: 'center',
            marginRight: theme.space.xs,
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
    });

