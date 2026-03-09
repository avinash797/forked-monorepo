import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useProcessBattle, useSkipBattle } from '@/hooks/use-comparisons';
import { useRatingStore } from '@/stores';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    SlideInLeft,
    SlideInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompareScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useMemo(
        () => createThemedStyles(theme, insets),
        [theme, insets]
    );

    // Static params — set once from rating.tsx, don't change between battles
    const params = useLocalSearchParams<{
        yourPhoto: string;
        yourRestaurant: string;
        dishTypeName: string;
        dishTypeId: string;
    }>();

    const [isProcessing, setIsProcessing] = useState(false);

    const { battleState, setBattleState, clearBattleState, resetRating } =
        useRatingStore();

    const { mutateAsync: processBattle } = useProcessBattle();
    const { mutateAsync: skipBattle } = useSkipBattle();

    // If battleState is gone (cleared externally), navigate away
    useEffect(() => {
        if (!battleState) {
            router.replace('/(protected)/(tabs)');
        }
    }, [battleState, router]);

    const handleVote = useCallback(
        async (winnerId: string) => {
            if (isProcessing || !battleState) return;

            if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setIsProcessing(true);
            try {
                const result = await processBattle({
                    battle_id: battleState.battleId,
                    winner_rating_id: winnerId,
                    new_rating_id: battleState.ratingId,
                    dish_type_id: params.dishTypeId,
                });

                if (result.battle_complete) {
                    clearBattleState();
                    resetRating();
                    router.dismissAll();
                    router.replace('/(protected)/(tabs)');
                } else {
                    setBattleState({
                        battleId: battleState.battleId,
                        ratingId: battleState.ratingId,
                        maxSteps: battleState.maxSteps,
                        currentStep: result.step ?? battleState.currentStep + 1,
                        opponent: result.opponent!,
                    });
                }
            } catch (error) {
                console.error('Error processing battle:', error);
            } finally {
                setIsProcessing(false);
            }
        },
        [battleState, isProcessing, processBattle, params.dishTypeId, setBattleState, clearBattleState, resetRating, router]
    );

    const handleSkip = useCallback(
        async () => {
            if (isProcessing || !battleState) return;

            setIsProcessing(true);

            try {
                await skipBattle({
                    battle_id: battleState.battleId,
                    dish_type_id: params.dishTypeId,
                });

                // Skip always ends the battle immediately
                clearBattleState();
                resetRating();
                router.dismissAll();
                router.replace('/(protected)/(tabs)');
            } catch (error) {
                console.error('Error skipping battle:', error);
            } finally {
                setIsProcessing(false);
            }
        },
        [battleState, isProcessing, skipBattle, params.dishTypeId, clearBattleState, resetRating, router]
    );

    const handleClose = () => {
        clearBattleState();
        resetRating();
        router.dismissAll();
        router.replace('/(protected)/(tabs)');
    };

    if (!battleState) {
        return null;
    }

    const { maxSteps, currentStep, opponent, ratingId } = battleState;

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

                <View style={styles.headerCenter}>
                    <ThemedText style={styles.headerTitle}>
                        Which {params.dishTypeName} wins?
                    </ThemedText>
                    <ThemedText style={styles.stepIndicator}>
                        Step {currentStep} of {maxSteps}
                    </ThemedText>
                </View>

                <Pressable
                    style={styles.skipButton}
                    onPress={() => handleSkip()}
                    disabled={isProcessing}
                >
                    <ThemedText style={styles.skipText}>
                        Skip
                    </ThemedText>
                </Pressable>
            </Animated.View>

            {/* Comparison Cards */}
            <View style={styles.cardsContainer}>
                {/* Your new dish */}
                <Animated.View
                    entering={SlideInLeft.delay(300).duration(500)}
                    style={styles.cardWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            pressed && styles.cardPressed,
                        ]}
                        onPress={() => handleVote(ratingId)}
                        disabled={isProcessing}
                    >
                        <Image
                            source={{ uri: params.yourPhoto }}
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
                                {params.yourRestaurant}
                            </ThemedText>
                            <View style={styles.newBadgeContainer}>
                                <ThemedText style={styles.newBadgeText}>
                                    NEW
                                </ThemedText>
                            </View>
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

                {/* Opponent */}
                <Animated.View
                    entering={SlideInRight.delay(300).duration(500)}
                    style={styles.cardWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            pressed && styles.cardPressed,
                        ]}
                        onPress={() => handleVote(opponent.rating_id)}
                        disabled={isProcessing}
                    >
                        <Image
                            source={{ uri: opponent.photo_url }}
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
                                {opponent.restaurant_name}
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
            width: 44,
        },
        headerCenter: {
            flex: 1,
            alignItems: 'center',
            gap: 2,
        },
        headerTitle: {
            fontSize: theme.font.size.md,
            fontWeight: '700',
            color: theme.color.textPrimary,
            textAlign: 'center',
        },
        stepIndicator: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            fontVariant: ['tabular-nums'] as any,
        },
        skipButton: {
            padding: theme.space.xs,
            width: 44,
            alignItems: 'flex-end',
            flexDirection: 'row',
            gap: 4,
            justifyContent: 'flex-end',
        },
        skipText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
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
            borderCurve: 'continuous',
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
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
        },
        restaurantName: {
            fontSize: theme.font.size.xl,
            fontWeight: '700',
            color: theme.color.textOnImage,
            flex: 1,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
        },
        newBadgeContainer: {
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.sm,
            borderCurve: 'continuous',
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        newBadgeText: {
            fontSize: 11,
            fontWeight: '800',
            color: theme.color.accentOn,
            letterSpacing: 0.5,
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
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
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
            color: theme.color.textOnImage,
        },
    });
