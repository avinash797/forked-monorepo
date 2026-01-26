import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/theme-provider';
import { TopDishData } from '@/hooks/use-discover-data';
import { trackEvent } from '@/lib/amplitude';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface HeroCardProps {
    /** The dish type ID for navigation */
    dishTypeId: string;
    /** The top dish data to display */
    dish: TopDishData;
    /** Index for staggered animation */
    index?: number;
}

/**
 * HeroCard - Presentational component for displaying the #1 ranked dish
 *
 * This is a "dumb" component that receives data as props.
 * Data fetching is handled by the parent using useDiscoverData hook.
 */
export default function HeroCard({
    dishTypeId,
    dish,
    index = 0,
}: HeroCardProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const styles = createStyles(theme, windowWidth);

    const confidence = Math.max(1, Math.ceil((dish.confidence_score ?? 0) * 5));
    const flames = '🔥'.repeat(confidence);

    const handleHeroPress = () => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: dish.restaurant_id,
                dishTypeId: dishTypeId,
            },
        });
        trackEvent('hero_card_pressed', {
            restaurant_id: dish.restaurant_id,
            dish_type_id: dishTypeId,
        });
    };

    // Staggered entrance animation
    const enteringAnimation = FadeInRight.duration(400)
        .delay(index * 100)
        .damping(15);

    return (
        <Animated.View entering={enteringAnimation} style={styles.container}>
            <Pressable
                onPress={handleHeroPress}
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

                    {/* Rank Badge */}
                    <View style={styles.rankBadge}>
                        <ThemedText style={styles.rankText}>👑 #1</ThemedText>
                    </View>
                </View>

                {/* Content Overlay/Section */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <ThemedText
                            type="subtitle"
                            numberOfLines={1}
                            style={styles.restaurantName}
                        >
                            {dish.restaurant_name}
                        </ThemedText>
                    </View>

                    <View style={styles.detailsRow}>
                        <ThemedText style={styles.detailText}>
                            {dish.neighborhood_name}
                        </ThemedText>
                    </View>

                    <View style={styles.scoreRow}>
                        <ThemedText style={styles.flames}>{flames}</ThemedText>
                        <ThemedText style={styles.confidenceLabel}>
                            High Confidence
                        </ThemedText>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

/**
 * Skeleton placeholder for HeroCard during loading with pulsing animation
 */
export function HeroCardSkeleton() {
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
                            { width: '40%', height: 16, marginTop: 8 },
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
            marginVertical: theme.space.sm,
            minWidth: windowWidth * 0.85,
        },
        card: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
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
            height: 250,
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
        rankBadge: {
            position: 'absolute',
            top: theme.space.md,
            left: theme.space.md,
            backgroundColor: 'rgba(255, 215, 0, 0.95)', // Gold
            paddingHorizontal: theme.space.sm,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        rankText: {
            fontWeight: 'bold',
            color: '#000',
            fontSize: 14,
        },
        content: {
            padding: theme.space.md,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        restaurantName: {
            fontSize: 20,
            fontWeight: '700',
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.sm,
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
        flames: {
            fontSize: 16,
            letterSpacing: 2,
        },
        confidenceLabel: {
            fontSize: 12,
            color: theme.color.textSecondary,
            fontWeight: '600',
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
