import { ConfidenceMeter } from '@/components/Discover/confidence-meter';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useRisingStars } from '@/hooks/use-rising-stars';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface RisingStarCardProps {
    cityId?: string;
    dishTypeId?: string;
}

/**
 * RisingStarCard - Highlights "Hole in the Wall" discoveries
 *
 * Shows dishes with:
 * - High avg_raw_score (≥ 7.5)
 * - Low total_battles (< 10)
 *
 * Purpose:
 * - Encourages users to verify hidden gems
 * - Feeds the data flywheel
 * - Aligns with "Anti-Yelp" positioning
 *
 * Used in: Home screen (below hero card)
 */
export default function RisingStarCard({
    cityId,
    dishTypeId,
}: RisingStarCardProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { data: risingStars, isLoading } = useRisingStars({
        cityId,
        dishTypeId,
        limit: 1,
    });

    if (isLoading || !risingStars || risingStars.length === 0) {
        return null;
    }

    const dish = risingStars[0];

    const handlePress = () => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: dish.restaurant_id,
                dishTypeId: dish.dish_type_id,
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <IconSymbol
                    name="sparkles-outline"
                    size={20}
                    color={theme.color.warning}
                />
                <ThemedText style={styles.headerText}>Rising Star</ThemedText>
                <ThemedText style={styles.headerSubtext}>
                    Hidden gem to discover
                </ThemedText>
            </View>

            {/* Card */}
            <Animated.View entering={FadeIn.duration(500).delay(200)}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handlePress}
                    style={styles.card}
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

                        {/* Rising Star Badge */}
                        <View style={styles.starBadge}>
                            <ThemedText style={styles.starText}>
                                ⭐ Rising
                            </ThemedText>
                        </View>
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
                        </View>

                        <View style={styles.detailsRow}>
                            <ThemedText style={styles.dishType}>
                                {dish.dish_type_emoji} {dish.dish_type_name}
                            </ThemedText>
                            {dish.neighborhood_name && (
                                <>
                                    <ThemedText style={styles.dot}>•</ThemedText>
                                    <ThemedText style={styles.detailText}>
                                        {dish.neighborhood_name}
                                    </ThemedText>
                                </>
                            )}
                        </View>

                        <View style={styles.scoreRow}>
                            <ThemedText style={styles.scoreLabel}>
                                {dish.avg_raw_score.toFixed(1)}/10
                            </ThemedText>
                            <ThemedText style={styles.dot}>•</ThemedText>
                            <ConfidenceMeter
                                confidenceScore={dish.confidence_score}
                                totalBattles={dish.total_battles}
                                variant="compact"
                            />
                        </View>

                        <View style={styles.callToActionRow}>
                            <ThemedText style={styles.callToAction}>
                                Be an early reviewer!
                            </ThemedText>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: theme.space.md,
            marginVertical: theme.space.md,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.sm,
            gap: theme.space.xs,
        },
        headerText: {
            fontSize: theme.font.size.lg,
            fontWeight: '700',
            color: theme.color.textPrimary,
        },
        headerSubtext: {
            fontSize: theme.font.size.sm,
            fontWeight: '400',
            color: theme.color.textSecondary,
            marginLeft: 'auto',
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
        starBadge: {
            position: 'absolute',
            top: theme.space.md,
            left: theme.space.md,
            backgroundColor: 'rgba(251, 191, 36, 0.95)', // Warning color
            paddingHorizontal: theme.space.sm,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        starText: {
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
        scoreLabel: {
            fontSize: 16,
            color: theme.color.success,
            fontWeight: '700',
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
    });
