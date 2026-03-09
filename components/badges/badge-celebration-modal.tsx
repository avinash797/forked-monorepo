import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { useBadgeStore } from '@/stores/use-badge-store';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';

export function BadgeCelebrationModal() {
    const { theme } = useTheme();
    const { currentBadge, dismiss } = useBadgeStore();
    const styles = createStyles(theme);

    useEffect(() => {
        if (!currentBadge) return;
        const delays = [0, 80, 160, 220, 300, 360];
        const timers = delays.map((delay) =>
            setTimeout(
                () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
                delay
            )
        );
        return () => timers.forEach(clearTimeout);
    }, [currentBadge]);

    return (
        <Modal
            visible={currentBadge !== null}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={dismiss}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={BounceIn.springify().damping(14)}
                    style={styles.card}
                >
                    <ThemedText style={styles.headline}>
                        Achievement Unlocked!
                    </ThemedText>

                    <View style={styles.imageContainer}>
                        {currentBadge?.image_url ? (
                            <Image
                                source={{ uri: currentBadge.image_url }}
                                style={styles.badgeImage}
                                contentFit="contain"
                            />
                        ) : (
                            <View style={styles.badgePlaceholder}>
                                <ThemedText style={styles.placeholderEmoji}>
                                    🏅
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.badgeName}>
                        {currentBadge?.name}
                    </ThemedText>
                    <ThemedText style={styles.badgeDescription}>
                        {currentBadge?.description}
                    </ThemedText>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={dismiss}
                    >
                        <ThemedText style={styles.buttonText}>
                            Awesome!
                        </ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.space.xl,
        },
        card: {
            backgroundColor: theme.color.bg,
            borderRadius: theme.radius.xl,
            paddingVertical: theme.space.xxl,
            paddingHorizontal: theme.space.xl,
            alignItems: 'center',
            width: '100%',
            maxWidth: 340,
        },
        headline: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.semibold,
            color: theme.color.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: theme.space.lg,
        },
        imageContainer: {
            marginBottom: theme.space.lg,
        },
        badgeImage: {
            width: 120,
            height: 120,
        },
        badgePlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderEmoji: {
            fontSize: 56,
        },
        badgeName: {
            fontSize: theme.font.size.xxl,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            textAlign: 'center',
            marginBottom: theme.space.xs,
        },
        badgeDescription: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            textAlign: 'center',
            marginBottom: theme.space.xxl,
            lineHeight: theme.font.size.sm * 1.5,
        },
        button: {
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.xxl,
        },
        buttonPressed: {
            opacity: 0.8,
        },
        buttonText: {
            color: theme.color.accentOn,
            fontWeight: theme.font.weight.bold,
            fontSize: theme.font.size.md,
        },
    });
