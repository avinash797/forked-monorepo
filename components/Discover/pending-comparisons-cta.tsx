import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { usePendingComparisons } from '@/hooks/use-comparisons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Adds alpha channel to a hex color string
 */
const addAlpha = (hex: string, opacity: number) => {
    const normalizedHex = hex.replace('#', '');
    const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
    return `#${normalizedHex}${alpha}`;
};

/**
 * PendingComparisonsCTA - Call-to-action banner for pending dish comparisons
 *
 * Upgraded with premium visuals:
 * - Animated gradient background
 * - Pulsing battle icon
 * - Elegant image overlap for "VS"
 * - Clear, engaging copy
 */
export function PendingComparisonsCTA() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = createThemedStyles(theme);
    const { data: comparisons, isLoading } = usePendingComparisons(5);

    const pulseValue = useSharedValue(1);
    const scaleValue = useSharedValue(1);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const count = comparisons?.length ?? 0;

    const handlePress = () => {
        // Battles are now triggered only from the rating flow; standalone pending battles no longer exist.
    };

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
    }));

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleValue.value }],
    }));

    if (isLoading || count === 0) {
        return null;
    }

    const hasPhotos = false;

    return (
        <Animated.View
            entering={FadeInRight.delay(200).springify()}
            style={styles.container}
        >
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={() => {
                    scaleValue.value = withSpring(0.98);
                }}
                onPressOut={() => {
                    scaleValue.value = withSpring(1);
                }}
                style={[styles.pressable, animatedContainerStyle]}
            >
                <LinearGradient
                    colors={[
                        theme.color.accent,
                        addAlpha(theme.color.accent, 0.85),
                        addAlpha(theme.color.accent, 0.7),
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.banner}
                >
                    <View style={styles.contentRow}>
                        {/* Left: Animated Battle Icon */}
                        <View style={styles.iconWrapper}>
                            <Animated.View
                                style={[styles.iconContainer, pulseStyle]}
                            >
                                <IconSymbol
                                    name="flash"
                                    size={22}
                                    color="#FFFFFF"
                                />
                            </Animated.View>
                        </View>

                        {/* Center: Text Content */}
                        <View style={styles.textContainer}>
                            <ThemedText style={styles.title}>
                                Verdict Needed
                            </ThemedText>
                            <ThemedText style={styles.subtitle}>
                                {count === 1
                                    ? 'Vote the better dish'
                                    : `${count} dish battles waiting for your vote`}
                            </ThemedText>
                        </View>

                        {/* Right: Action Badge */}
                        <View style={styles.actionBadge}>
                            <ThemedText style={styles.actionText}>
                                VOTE
                            </ThemedText>
                            <IconSymbol
                                name="chevron-forward"
                                size={14}
                                color="#FFFFFF"
                            />
                        </View>
                    </View>
                </LinearGradient>
            </AnimatedPressable>
        </Animated.View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginHorizontal: theme.space.md,
            marginVertical: theme.space.sm,
            shadowColor: theme.color.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        pressable: {
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
        },
        banner: {
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.md,
        },
        contentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
        },
        iconWrapper: {
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.4)',
        },
        textContainer: {
            flex: 1,
        },
        title: {
            fontSize: 18,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -0.5,
            marginBottom: 2,
        },
        subtitle: {
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 16,
        },
        previewStack: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 50,
            width: 80,
            justifyContent: 'flex-end',
            gap: theme.space.xxs,
        },
        imageFrame: {
            width: 60,
            height: 60,
            borderRadius: theme.radius.md,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        vsCircle: {
            position: 'absolute',
            left: 8,
            top: 14,
            zIndex: 10,
            backgroundColor: '#FFFFFF',
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
        },
        vsText: {
            fontSize: 10,
            fontWeight: '900',
            color: theme.color.accent,
        },
        actionBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            gap: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        actionText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#FFFFFF',
        },
    });
