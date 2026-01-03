import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import type { DishWithVenue } from '@/types/browse';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

interface DishCardWithRatingProps {
    dish: DishWithVenue;
    onPress: () => void;
    showVenue?: boolean;
}

/**
 * Enhanced dish card component that displays rating and review count
 * Photo dominating design with text overlay
 * Uses 0-10 numeric rating scale (NOT stars)
 * Used in: Home feed, search results, venue detail
 */
export function DishCardWithRating({
    dish,
    onPress,
    showVenue = false,
}: DishCardWithRatingProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const hasPhoto = dish.photos && dish.photos.length > 0;
    const photoUrl = hasPhoto ? dish.photos?.[0] : null;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
        >
            {/* Background Image */}
            {photoUrl ? (
                <Image
                    source={{ uri: photoUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: theme.color.surface },
                    ]}
                />
            )}

            {/* Gradient Overlay for text readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Content Overlay */}
            <View style={styles.cardContent}>
                {/* Top Right: Rating Badge */}
                {dish.average_rating !== null && dish.review_count > 0 && (
                    <ScoreBadge
                        score={dish.average_rating}
                        style={styles.ratingBadge}
                    />
                )}

                {/* Bottom Content */}
                <View style={styles.bottomContent}>
                    {/* Name and Price */}
                    <View style={styles.header}>
                        <ThemedText
                            type="defaultSemiBold"
                            style={styles.name}
                            numberOfLines={2}
                        >
                            {dish.name}
                        </ThemedText>
                        {dish.current_price && (
                            <ThemedText style={styles.price}>
                                ${dish.current_price.toFixed(0)}
                            </ThemedText>
                        )}
                    </View>

                    {/* Review Count & Category */}
                    <ThemedText style={styles.subtext} numberOfLines={1}>
                        {dish.review_count}{' '}
                        {dish.review_count === 1 ? 'review' : 'reviews'} •{' '}
                        {dish.category}
                    </ThemedText>

                    {/* Venue Name (optional) */}
                    {showVenue && dish.venue && (
                        <ThemedText style={styles.venueName} numberOfLines={1}>
                            @ {dish.venue.name}
                        </ThemedText>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        card: {
            marginBottom: theme.space.sm,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            overflow: 'hidden',
            height: 400, // Fixed height for photo dominance
            width: '100%', // Allow container to control width
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
        },
        cardContent: {
            flex: 1,
            justifyContent: 'space-between',
            padding: theme.space.sm,
        },
        ratingBadge: {
            alignSelf: 'flex-end',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
            elevation: 2,
        },
        bottomContent: {
            justifyContent: 'flex-end',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 2,
        },
        name: {
            flex: 1,
            fontSize: theme.font.size.lg,
            color: '#FFFFFF', // Always white on photo
            marginRight: theme.space.xs,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
        },
        price: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: '#FFFFFF', // Always white on photo
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
        },
        subtext: {
            fontSize: theme.font.size.sm,
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: theme.font.weight.medium,
        },
        venueName: {
            fontSize: theme.font.size.sm,
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: 2,
            fontStyle: 'italic',
        },
    });
