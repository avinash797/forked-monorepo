import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { usePendingComparisons } from '@/hooks/use-pending-comparisons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

/**
 * PendingComparisonsCTA - Call-to-action banner for pending dish comparisons
 *
 * Displays when user has dishes available to compare (battle) with:
 * - Count of pending comparisons
 * - Preview photos of dishes to compare
 * - VS indicator between dishes
 * - Navigates to compare screen on press
 *
 * Purpose:
 * - Encourages users to engage with the comparison/battle feature
 * - Shows users have unfinished battles waiting
 * - Drives ELO ranking participation
 *
 * Used in: Home screen (above RecentBattleTicker)
 */
export function PendingComparisonsCTA() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { comparisons, hasPending, count, isLoading } = usePendingComparisons({ limit: 5 });

    // Don't render if no pending comparisons or still loading
    if (isLoading || !hasPending || count === 0) {
        return null;
    }

    const handlePress = () => {
        // Navigate to the compare screen with the first pending comparison
        const firstComparison = comparisons[0];
        if (firstComparison) {
            router.push({
                pathname: '/(protected)/(rating)/compare',
                params: {
                    ratingAId: firstComparison.rating_a_id,
                    ratingBId: firstComparison.rating_b_id,
                },
            });
        }
    };

    // Get first comparison for preview
    const firstComparison = comparisons[0];
    const hasPhotos = firstComparison?.rating_a_photo || firstComparison?.rating_b_photo;

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
        >
            <ThemedView style={styles.banner}>
                <View style={styles.contentRow}>
                    {/* Left: Battle icon */}
                    <View style={styles.iconContainer}>
                        <IconSymbol
                            name="flash"
                            size={20}
                            color={theme.color.accentOn}
                        />
                    </View>

                    {/* Center: Text */}
                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title}>
                            Battle Time!
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            {count === 1
                                ? `Compare your ${firstComparison?.dish_type_name || 'dishes'}`
                                : `${count} comparisons ready`}
                        </ThemedText>
                    </View>

                    {/* Right: Photo previews or VS badge */}
                    {hasPhotos ? (
                        <View style={styles.previewContainer}>
                            <View style={styles.previewImage}>
                                {firstComparison?.rating_a_photo ? (
                                    <Image
                                        source={{ uri: firstComparison.rating_a_photo }}
                                        style={styles.image}
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <IconSymbol
                                            name="restaurant-outline"
                                            size={16}
                                            color={theme.color.textSecondary}
                                        />
                                    </View>
                                )}
                            </View>
                            <View style={styles.vsContainer}>
                                <ThemedText style={styles.vsText}>VS</ThemedText>
                            </View>
                            <View style={[styles.previewImage, styles.previewImageOverlap]}>
                                {firstComparison?.rating_b_photo ? (
                                    <Image
                                        source={{ uri: firstComparison.rating_b_photo }}
                                        style={styles.image}
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <IconSymbol
                                            name="restaurant-outline"
                                            size={16}
                                            color={theme.color.textSecondary}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.vsBadge}>
                            <ThemedText style={styles.vsBadgeText}>VS</ThemedText>
                        </View>
                    )}

                    {/* Arrow */}
                    <IconSymbol
                        name="chevron-forward"
                        size={20}
                        color={theme.color.textSecondary}
                        style={styles.arrow}
                    />
                </View>
            </ThemedView>
        </Pressable>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginHorizontal: theme.space.md,
            marginVertical: theme.space.sm,
        },
        pressed: {
            opacity: 0.8,
        },
        banner: {
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.accent,
            overflow: 'hidden',
        },
        contentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.md,
            gap: theme.space.sm,
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        textContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: theme.color.accentOn,
        },
        subtitle: {
            fontSize: theme.font.size.sm,
            color: theme.color.accentOn,
            opacity: 0.9,
        },
        previewContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        previewImage: {
            width: 32,
            height: 32,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: theme.color.accentOn,
            backgroundColor: theme.color.surface,
        },
        previewImageOverlap: {
            marginLeft: -8,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        imagePlaceholder: {
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.color.surface,
        },
        vsContainer: {
            position: 'absolute',
            left: 12,
            zIndex: 1,
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderWidth: 1,
            borderColor: theme.color.accentOn,
        },
        vsText: {
            fontSize: 8,
            fontWeight: theme.font.weight.bold,
            color: theme.color.accentOn,
        },
        vsBadge: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.space.sm,
            paddingVertical: theme.space.xxs,
        },
        vsBadgeText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.bold,
            color: theme.color.accentOn,
        },
        arrow: {
            opacity: 0.8,
        },
    });
