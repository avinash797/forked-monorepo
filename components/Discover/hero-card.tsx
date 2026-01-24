import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/contexts/theme-provider';
import { useTopDish } from '@/hooks/use-leaderboard';
import { trackEvent } from '@/lib/amplitude';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface HeroCardProps {
    cityId: string;
    dishTypeId: string;
}

export default function HeroCard({ cityId, dishTypeId }: HeroCardProps) {
    const router = useRouter();

    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { data: topDish, isLoading: topDishLoading } = useTopDish(
        cityId,
        dishTypeId
    );

    const confidence = Math.max(
        1,
        Math.ceil((topDish?.confidence_score ?? 0) * 5)
    );
    const flames = '🔥'.repeat(confidence);

    const distance = undefined;

    const handleHeroPress = () => {
        if (topDish?.restaurant_id && dishTypeId) {
            // Navigate to dish detail
            router.push({
                pathname: '/(protected)/(browse)/dish-detail',
                params: {
                    restaurantId: topDish.restaurant_id,
                    dishTypeId: dishTypeId,
                },
            });
            trackEvent('hero_card_pressed', {
                restaurant_id: topDish.restaurant_id,
                dish_type_id: dishTypeId,
            });
        }
    };

    if (!topDish) {
        return <View style={styles.container} />;
    }

    return (
        <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleHeroPress}
                style={styles.card}
            >
                {/* Image Background */}
                <View style={styles.imageContainer}>
                    {topDish?.featured_photo_url ? (
                        <Image
                            source={{ uri: topDish.featured_photo_url }}
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
                            {topDish?.restaurant_name}
                        </ThemedText>
                    </View>

                    <View style={styles.detailsRow}>
                        <ThemedText style={styles.detailText}>
                            {topDish?.neighborhood_name}
                        </ThemedText>
                        {distance && (
                            <>
                                <ThemedText style={styles.dot}>•</ThemedText>
                                <ThemedText style={styles.detailText}>
                                    {distance}
                                </ThemedText>
                            </>
                        )}
                    </View>

                    <View style={styles.scoreRow}>
                        <ThemedText style={styles.flames}>{flames}</ThemedText>
                        <ThemedText style={styles.confidenceLabel}>
                            High Confidence
                        </ThemedText>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: theme.space.md,
            marginVertical: theme.space.sm,
            flex: 1,
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
        dot: {
            color: theme.color.textSecondary,
            marginHorizontal: 6,
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
    });
