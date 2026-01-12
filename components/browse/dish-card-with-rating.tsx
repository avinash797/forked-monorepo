import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { TrendIndicator } from '@/components/trend-indicator';
import { useTheme } from '@/contexts/theme-provider';
import type { DishWithVenue, TrendingDish } from '@/types/browse';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

interface DishCardWithRatingProps {
    /** The dish to display (can be DishWithVenue or TrendingDish) */
    dish: DishWithVenue | TrendingDish;
    onPress: () => void;
    showVenue?: boolean;
    viewMode?: 'vertical' | 'horizontal';
    /** Show trend indicator if dish has trending data */
    showTrend?: boolean;
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
    viewMode = 'vertical',
    showTrend = false,
}: DishCardWithRatingProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, Dimensions.get('window').width);

    const hasPhoto = dish.photos && dish.photos.length > 0;
    const photoUrl = hasPhoto ? dish.photos?.[0] : null;

    // Check if dish has trending data (TrendingDish type)
    const trendingDish = dish as TrendingDish;
    const hasTrendData = showTrend && trendingDish.trend_direction;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                viewMode === 'vertical'
                    ? styles.verticalCard
                    : styles.horizontalCard,
                pressed && { opacity: 0.9 },
            ]}
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
                {/* Top Right: Rating Badge + Trend Indicator */}
                <View style={styles.topRightContainer}>
                    {hasTrendData && trendingDish.trend_direction !== 'new' && (
                        <View style={styles.trendBadge}>
                            <TrendIndicator
                                direction={trendingDish.trend_direction}
                                change={trendingDish.rating_change_7d}
                                showChange={true}
                                size="md"
                            />
                        </View>
                    )}
                    {dish.average_rating !== null && dish.review_count > 0 && (
                        <ScoreBadge
                            score={dish.average_rating}
                            style={styles.ratingBadge}
                        />
                    )}
                </View>

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

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    windowWidth: number
) =>
    StyleSheet.create({
        card: {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.color.surface,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
        },
        verticalCard: {
            marginBottom: theme.space.sm,
            height: 400, // Fixed height for photo dominance
            width: '100%', // Allow container to control width
        },
        horizontalCard: {
            marginRight: theme.space.sm,
            height: 200,
            width: windowWidth - 0.12 * windowWidth,
        },
        cardContent: {
            flex: 1,
            justifyContent: 'space-between',
            padding: theme.space.sm,
        },
        topRightContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            gap: theme.space.xs,
        },
        trendBadge: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingHorizontal: theme.space.xs,
            paddingVertical: theme.space.xxs,
            borderRadius: theme.radius.sm,
        },
        ratingBadge: {
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
