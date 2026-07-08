import { ConfidenceMeter } from '@/components/Discover/confidence-meter';
import { ThemedText } from '@/components/themed-text';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { RisingStarData } from '@/hooks/use-discover-data';
import { getTransformedImageUrl } from '@forked/utils';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { ScoreBadge } from '../score-badge';

interface RisingStarCardProps {
    /** The rising star dish data to display */
    dish: RisingStarData;
    /** Index for staggered animation */
    index?: number;
}

/**
 * RisingStarCard - Presentational component for "Hole in the Wall" discoveries
 *
 * Shows dishes with:
 * - High avg_raw_score (≥ 7.5)
 * - Low total_battles (< 10)
 *
 * This is a "dumb" component that receives data as props.
 * Data fetching is handled by the parent using useDiscoverData hook.
 *
 * Purpose:
 * - Encourages users to verify hidden gems
 * - Feeds the data flywheel
 * - Aligns with "Anti-Yelp" positioning
 */
export default function RisingStarCard({
    dish,
    index = 0,
}: RisingStarCardProps) {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const styles = createStyles(theme, windowWidth);
    const router = useRouter();

    const handlePress = () => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: dish.restaurant_id,
                dishTypeId: dish.dish_type_id,
            },
        });
    };

    // Staggered entrance animation
    const enteringAnimation = FadeInRight.duration(400)
        .delay(index * 100)
        .damping(15);

    return (
        <Animated.View entering={enteringAnimation} style={styles.container}>
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                ]}
            >
                {/* Image Background */}
                <View style={styles.imageContainer}>
                    {dish.featured_photo_url ? (
                        <Image
                            source={{
                                uri: getTransformedImageUrl(
                                    dish.featured_photo_url,
                                    { width: 600 }
                                )!,
                            }}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={[styles.image, styles.placeholder]}>
                            <IconSymbol
                                name="image-outline"
                                size={40}
                                color={theme.color.textSecondary}
                            />
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <ThemedText
                            type="subtitle"
                            numberOfLines={1}
                            style={styles.dishTypeName}
                        >
                            <DishTypeIcon
                                icon={dish.dish_type_icon}
                                emoji={dish.dish_type_emoji}
                                size={16}
                            />{' '}
                            {dish.dish_type_name}
                        </ThemedText>

                        <ScoreBadge score={dish.bayesian_score} />
                    </View>

                    <View style={styles.detailsRow}>
                        <View>
                            <ThemedText style={styles.restaurantName}>
                                @ {dish.restaurant_name}
                            </ThemedText>
                            {dish.neighborhood_name && (
                                <ThemedText style={styles.detailText}>
                                    <IconSymbol
                                        name="location-outline"
                                        size={16}
                                        color={theme.color.textSecondary}
                                    />
                                    {dish.neighborhood_name}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.scoreRow}>
                        <ConfidenceMeter
                            confidenceTier={dish.confidence_tier}
                            totalRatings={dish.total_ratings}
                            variant="full"
                        />
                    </View>

                    <View style={styles.callToActionRow}>
                        <ThemedText style={styles.callToAction}>
                            Be an early reviewer!
                        </ThemedText>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

/**
 * Empty state card for RisingStarCard when no hidden gems are available
 */
export function RisingStarCardEmpty() {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const router = useRouter();
    const styles = createStyles(theme, windowWidth);

    return (
        <Animated.View
            entering={FadeInRight.duration(400)}
            style={styles.container}
        >
            <View style={[styles.card, styles.emptyCard]}>
                {/* Illustration area */}
                <View style={styles.emptyIllustrationContainer}>
                    <View style={styles.emptyIconWrapper}>
                        <IconSymbol
                            name="sparkles-outline"
                            size={48}
                            color={theme.color.warning}
                        />
                    </View>
                    <ThemedText style={styles.emptyIllustrationLabel}>
                        Not enough data yet
                    </ThemedText>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <ThemedText type="subtitle" style={styles.dishTypeName}>
                        Hidden Gems Await
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                        Every legend starts somewhere — don&apos;t keep that
                        secret spot to yourself! Let us in on that!
                    </ThemedText>
                    <View style={styles.callToActionRow}>
                        <Pressable
                            onPress={() => router.push('/(protected)/(rating)')}
                            style={({ pressed }) =>
                                pressed && { opacity: theme.opacity.pressed }
                            }
                        >
                            <ThemedText style={styles.callToAction}>
                                Rate a Hidden Spot →
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

/**
 * Skeleton placeholder for RisingStarCard during loading with pulsing animation
 */
export function RisingStarCardSkeleton() {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const styles = createStyles(theme, windowWidth);

    // Pulsing animation
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 800 }),
            -1, // infinite
            true // reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Animated.View
                    style={[
                        styles.imageContainer,
                        styles.skeleton,
                        animatedStyle,
                    ]}
                />
                <View style={styles.content}>
                    <Animated.View
                        style={[
                            styles.skeletonText,
                            { width: '70%', height: 24 },
                            animatedStyle,
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.skeletonText,
                            { width: '50%', height: 16, marginTop: 8 },
                            animatedStyle,
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.skeletonText,
                            { width: '60%', height: 20, marginTop: 8 },
                            animatedStyle,
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.skeletonText,
                            { width: '40%', height: 14, marginTop: 12 },
                            animatedStyle,
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

const createStyles = (theme: any, windowWidth: number) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: theme.space.md,
            marginVertical: theme.space.md,
            minWidth: windowWidth * 0.85,
            maxWidth: windowWidth * 0.85,
        },
        card: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: theme.color.warning + '40', // Semi-transparent warning color
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        },
        cardPressed: {
            opacity: 0.9,
            transform: [{ scale: 0.98 }],
        },
        imageContainer: {
            height: 200,
            width: '100%',
            backgroundColor: theme.color.backgroundSecondary,
            position: 'relative',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeholder: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            padding: theme.space.md,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.space.xs,
        },
        dishTypeName: {
            fontSize: 20,
            fontWeight: '700',
            textAlignVertical: 'center',
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.space.xs,
        },
        restaurantName: {
            color: theme.color.textSecondary,
            fontSize: 14,
            fontWeight: '600',
        },
        detailText: {
            color: theme.color.textSecondary,
            fontSize: 14,
        },
        scoreRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 8,
        },
        callToActionRow: {
            marginTop: theme.space.sm,
            paddingTop: theme.space.sm,
            borderTopWidth: 1,
            borderTopColor: theme.color.border,
        },
        callToAction: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.color.warning,
            textTransform: 'uppercase',
        },
        skeleton: {
            backgroundColor: theme.color.border,
        },
        skeletonText: {
            backgroundColor: theme.color.border,
            borderRadius: theme.radius.sm,
        },
        emptyCard: {
            borderStyle: 'dashed',
            borderColor: theme.color.warning + '60',
        },
        emptyIllustrationContainer: {
            height: 110,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.color.warning + '30',
        },
        emptyIconWrapper: {
            opacity: 0.35,
        },
        emptyIllustrationLabel: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            fontWeight: theme.font.weight.medium,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.7,
        },
        emptySubtext: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginBottom: theme.space.xs,
            lineHeight: 20,
        },
    });
