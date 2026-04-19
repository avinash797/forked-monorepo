import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { GroupedRestaurantDish } from '@/types/restaurant';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { ScoreBadge } from '../score-badge';

interface DishCardWithRatingProps {
    /** The grouped dish to display (de-duplicated by dish_type_id) */
    dish: GroupedRestaurantDish;
    onPress: () => void;
    viewMode?: 'vertical' | 'horizontal';
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
    viewMode = 'vertical',
}: DishCardWithRatingProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, Dimensions.get('window').width);

    const hasPhoto = dish.photos && dish.photos.length > 0;
    const photoUrl = hasPhoto ? dish.photos?.[0] : null;

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
                    {dish.bayesian_score !== null && dish.bayesian_score > 0 && (
                        <ScoreBadge score={dish.bayesian_score} />
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
                            {dish.type.name}
                        </ThemedText>
                    </View>

                    {/* Variation info & rating count */}
                    <ThemedText style={styles.subtext} numberOfLines={1}>
                        {dish.variations.length > 1
                            ? `${dish.variations.length} variations`
                            : dish.variations[0]?.name
                                ? `${dish.variations[0].name}`
                                : ''}
                    </ThemedText>
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
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface,
            overflow: 'hidden',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        verticalCard: {
            marginBottom: theme.space.sm,
            height: 400, // Fixed height for photo dominance
            width: '100%', // Allow container to control width
        },
        horizontalCard: {
            height: 200,
            width: '100%',
            flex: 1,
            flexGrow: 1,
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
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
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
