import { ConfidenceMeter } from '@/components/Discover/confidence-meter';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { RisingStarData } from '@/hooks/use-discover-data';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import Animated, {
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

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
        .springify()
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
                            source={{ uri: dish.featured_photo_url }}
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
                            style={styles.restaurantName}
                        >
                            {dish.restaurant_name}
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

                    <View style={styles.detailsRow}>
                        <ThemedText style={styles.dishType}>
                            {dish.dish_type_emoji} {dish.dish_type_name}
                        </ThemedText>
                    </View>

                    <View style={styles.scoreRow}>
                        <ConfidenceMeter
                            confidenceScore={dish.confidence_score}
                            totalBattles={dish.total_battles}
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
                    style={[styles.imageContainer, styles.skeleton, animatedStyle]}
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
        },
        card: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: theme.color.warning + '40', // Semi-transparent warning color
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
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
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            gap: theme.space.xs,
            marginBottom: 4,
        },
        restaurantName: {
            fontSize: 20,
            fontWeight: '700',
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        dishType: {
            color: theme.color.textPrimary,
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
    });
