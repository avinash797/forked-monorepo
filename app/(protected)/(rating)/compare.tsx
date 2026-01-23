import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    PendingComparison,
    SKIP_REASONS,
    useComparisonPair,
    usePendingComparisons,
    useProcessComparison,
} from '@/hooks/use-comparisons';
import { trackEvent } from '@/lib/amplitude';
import { useRatingStore } from '@/stores';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInLeft,
    SlideInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CompareScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useMemo(
        () => createThemedStyles(theme, insets),
        [theme, insets]
    );

    // Get params if coming from rating flow
    const params = useLocalSearchParams<{
        newRatingId?: string;
        comparisonRatingId?: string;
        dishTypeId?: string;
    }>();

    const [showSkipModal, setShowSkipModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { resetRating } = useRatingStore();

    // If params are provided, fetch the specific comparison pair
    const {
        data: specificPair,
        isLoading: isLoadingPair,
        error: pairError,
    } = useComparisonPair(
        params.newRatingId || null,
        params.comparisonRatingId || null,
        params.dishTypeId || null
    );

    // Otherwise, get pending comparisons
    const { data: pendingComparisons, refetch: refetchPending } =
        usePendingComparisons(1);

    // Determine which comparison to show
    const comparison: PendingComparison | null =
        specificPair || pendingComparisons?.[0] || null;

    const { mutateAsync: processComparison } = useProcessComparison();

    const handleVote = useCallback(
        async (winnerId: string) => {
            if (!comparison || isProcessing) return;

            setIsProcessing(true);
            try {
                await processComparison({
                    dish_type_id: comparison.dish_type_id,
                    rating_a_id: comparison.rating_a_id,
                    rating_b_id: comparison.rating_b_id,
                    winner_id: winnerId,
                });

                trackEvent('comparison_completed', {
                    dish_type_id: comparison.dish_type_id,
                    winner_id: winnerId,
                });

                // If from rating flow, go to tabs; otherwise fetch next
                if (params.newRatingId) {
                    resetRating();
                    router.dismissAll();
                    router.replace('/(protected)/(tabs)');
                } else {
                    refetchPending();
                }
            } catch (error) {
                console.error('Error processing comparison:', error);
            } finally {
                setIsProcessing(false);
            }
        },
        [
            comparison,
            processComparison,
            params.newRatingId,
            router,
            refetchPending,
            isProcessing,
            resetRating,
        ]
    );

    const handleSkip = useCallback(
        async (reason: string) => {
            if (!comparison || isProcessing) return;

            setIsProcessing(true);
            setShowSkipModal(false);
            try {
                await processComparison({
                    dish_type_id: comparison.dish_type_id,
                    rating_a_id: comparison.rating_a_id,
                    rating_b_id: comparison.rating_b_id,
                    skipped: true,
                    skip_reason: reason,
                });

                trackEvent('comparison_skipped', {
                    dish_type_id: comparison.dish_type_id,
                    skip_reason: reason,
                });

                if (params.newRatingId) {
                    resetRating();
                    router.dismissAll();
                    router.replace('/(protected)/(tabs)');
                } else {
                    refetchPending();
                }
            } catch (error) {
                console.error('Error skipping comparison:', error);
            } finally {
                setIsProcessing(false);
            }
        },
        [
            comparison,
            processComparison,
            params.newRatingId,
            router,
            refetchPending,
            isProcessing,
            resetRating,
        ]
    );

    const handleClose = () => {
        // If from rating flow, go to tabs; otherwise just go back
        if (params.newRatingId) {
            resetRating();
            router.dismissAll();
            router.replace('/(protected)/(tabs)');
        } else {
            router.back();
        }
    };

    // Loading state
    if (!comparison) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={theme.color.accent}
                    />
                    <ThemedText style={styles.loadingText}>
                        Finding dishes to compare...
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.header}
            >
                <Pressable style={styles.closeButton} onPress={handleClose}>
                    <IconSymbol
                        name="close"
                        size={24}
                        color={theme.color.textPrimary}
                    />
                </Pressable>
                <ThemedText style={styles.headerTitle}>This vs That</ThemedText>
                <Pressable
                    style={styles.skipButton}
                    onPress={() => setShowSkipModal(true)}
                >
                    <ThemedText style={styles.skipText}>Skip</ThemedText>
                </Pressable>
            </Animated.View>

            {/* Dish Type Badge */}
            {/* <Animated.View
                entering={FadeIn.delay(200).duration(400)}
                style={styles.dishTypeBadge}
            >
                <ThemedText style={styles.dishTypeText}>
                    Which {comparison.dish_type_name} wins?
                </ThemedText>
            </Animated.View> */}

            {/* Comparison Cards */}
            <View style={styles.cardsContainer}>
                {/* Card A */}
                <Animated.View
                    entering={SlideInLeft.delay(300).duration(500)}
                    style={styles.cardWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            pressed && styles.cardPressed,
                        ]}
                        onPress={() => handleVote(comparison.rating_a_id)}
                        disabled={isProcessing}
                    >
                        <Image
                            source={{ uri: comparison.rating_a_photo }}
                            style={styles.cardImage}
                            contentFit="cover"
                            transition={200}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.cardGradient}
                        />
                        <View style={styles.cardContent}>
                            <ThemedText style={styles.restaurantName}>
                                {comparison.rating_a_restaurant}
                            </ThemedText>
                        </View>
                    </Pressable>
                </Animated.View>

                {/* VS Divider */}
                <Animated.View
                    entering={FadeIn.delay(500).duration(400)}
                    style={styles.vsDivider}
                >
                    <View style={styles.vsCircle}>
                        <ThemedText style={styles.vsText}>VS</ThemedText>
                    </View>
                </Animated.View>

                {/* Card B */}
                <Animated.View
                    entering={SlideInRight.delay(300).duration(500)}
                    style={styles.cardWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            pressed && styles.cardPressed,
                        ]}
                        onPress={() => handleVote(comparison.rating_b_id)}
                        disabled={isProcessing}
                    >
                        <Image
                            source={{ uri: comparison.rating_b_photo }}
                            style={styles.cardImage}
                            contentFit="cover"
                            transition={200}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.cardGradient}
                        />
                        <View style={styles.cardContent}>
                            <ThemedText style={styles.restaurantName}>
                                {comparison.rating_b_restaurant}
                            </ThemedText>
                        </View>
                    </Pressable>
                </Animated.View>
            </View>

            {/* Processing Overlay */}
            {isProcessing && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.processingOverlay}
                >
                    <ActivityIndicator size="large" color="#fff" />
                    <ThemedText style={styles.processingText}>
                        Updating rankings...
                    </ThemedText>
                </Animated.View>
            )}

            {/* Skip Modal */}
            {showSkipModal && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.modalOverlay}
                >
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowSkipModal(false)}
                    />
                    <Animated.View
                        entering={FadeInUp.duration(300)}
                        style={styles.modalContent}
                    >
                        <ThemedText style={styles.modalTitle}>
                            Why are you skipping?
                        </ThemedText>
                        {SKIP_REASONS.map((reason) => (
                            <Pressable
                                key={reason.value}
                                style={styles.modalOption}
                                onPress={() => handleSkip(reason.value)}
                            >
                                <ThemedText style={styles.modalOptionText}>
                                    {reason.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                        <Pressable
                            style={styles.modalCancel}
                            onPress={() => setShowSkipModal(false)}
                        >
                            <ThemedText style={styles.modalCancelText}>
                                Cancel
                            </ThemedText>
                        </Pressable>
                    </Animated.View>
                </Animated.View>
            )}
        </ThemedView>
    );
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: ReturnType<typeof useSafeAreaInsets>
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: theme.space.md,
        },
        loadingText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + theme.space.sm,
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.sm,
        },
        closeButton: {
            padding: theme.space.xs,
        },
        headerTitle: {
            fontSize: theme.font.size.lg,
            fontWeight: '700',
            color: theme.color.textPrimary,
        },
        skipButton: {
            padding: theme.space.xs,
        },
        skipText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        dishTypeBadge: {
            alignSelf: 'center',
            paddingHorizontal: theme.space.lg,
            paddingVertical: theme.space.sm,
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            marginVertical: theme.space.md,
        },
        dishTypeText: {
            fontSize: theme.font.size.md,
            fontWeight: '700',
            color: theme.color.accentOn,
        },
        cardsContainer: {
            flex: 1,
            paddingHorizontal: theme.space.md,
            paddingBottom: insets.bottom + theme.space.md,
        },
        cardWrapper: {
            flex: 1,
            marginVertical: theme.space.xs,
        },
        card: {
            flex: 1,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            backgroundColor: theme.color.surface,
        },
        cardPressed: {
            transform: [{ scale: 0.98 }],
            opacity: 0.9,
        },
        cardImage: {
            ...StyleSheet.absoluteFillObject,
        },
        cardGradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '50%',
        },
        cardContent: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: theme.space.md,
        },
        restaurantName: {
            fontSize: theme.font.size.xl,
            fontWeight: '700',
            color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
        },
        vsDivider: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -25 }, { translateY: -25 }],
            zIndex: 10,
        },
        vsCircle: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.color.accent,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        vsText: {
            fontSize: 18,
            fontWeight: '900',
            color: theme.color.accentOn,
        },
        processingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            gap: theme.space.md,
        },
        processingText: {
            fontSize: theme.font.size.lg,
            fontWeight: '600',
            color: '#fff',
        },
        modalOverlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
        },
        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalContent: {
            backgroundColor: theme.color.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingTop: theme.space.lg,
            paddingBottom: insets.bottom + theme.space.lg,
            paddingHorizontal: theme.space.lg,
        },
        modalTitle: {
            fontSize: theme.font.size.lg,
            fontWeight: '700',
            color: theme.color.textPrimary,
            marginBottom: theme.space.md,
            textAlign: 'center',
        },
        modalOption: {
            paddingVertical: theme.space.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.color.border,
        },
        modalOptionText: {
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
        },
        modalCancel: {
            paddingVertical: theme.space.md,
            marginTop: theme.space.sm,
        },
        modalCancelText: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textSecondary,
            textAlign: 'center',
        },
    });
