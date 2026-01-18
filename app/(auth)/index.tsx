import { useTheme } from '@/contexts/theme-provider';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const slides = [
    {
        emoji: '🍲',
        title: 'Rate Dishes,\nNot Restaurants',
        subtitle: 'Because the best gumbo deserves its own crown.',
    },
    {
        emoji: '⚔️',
        title: 'This vs That',
        subtitle: 'Settle the debate. Which burger actually wins?',
    },
    {
        emoji: '👑',
        title: 'Find the Best',
        subtitle: 'The #1 gumbo in New Orleans. Ranked by locals.',
    },
    {
        emoji: '🔥',
        title: 'Trust the Locals',
        subtitle: 'No tourists. No sponsors. Just truth.',
    },
];

export default function OnboardingScreen() {
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<Animated.FlatList<(typeof slides)[0]>>(null);
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/(auth)/signup');
        }
    };

    const handleSkip = () => {
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <SlideItem item={item} index={index} scrollX={scrollX} />
                )}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <PaginationDot
                            key={index}
                            index={index}
                            scrollX={scrollX}
                        />
                    ))}
                </View>

                <Pressable onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>
                        {currentIndex === slides.length - 1
                            ? 'Get Started'
                            : 'Next'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

function SlideItem({
    item,
    index,
    scrollX,
}: {
    item: (typeof slides)[0];
    index: number;
    scrollX: SharedValue<number>;
}) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.8, 1, 0.8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View style={styles.slide}>
            <Animated.View style={[styles.slideContent, animatedStyle]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </Animated.View>
        </View>
    );
}

function PaginationDot({
    index,
    scrollX,
}: {
    index: number;
    scrollX: SharedValue<number>;
}) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const dotWidth = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.3, 1, 0.3],
            Extrapolation.CLAMP
        );

        return {
            width: dotWidth,
            opacity,
        };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        skipButton: {
            position: 'absolute',
            top: 60,
            right: theme.space.xl,
            zIndex: 1,
        },
        skipText: {
            fontFamily: theme.font.family.regular,
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
        },
        slide: {
            width,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.space.xl,
        },
        slideContent: {
            alignItems: 'center',
        },
        emoji: {
            fontSize: 100,
            marginBottom: theme.space.xxl,
        },
        title: {
            fontSize: theme.font.size.xxl,
            color: theme.color.textPrimary,
            textAlign: 'center',
            marginBottom: theme.space.lg,
            lineHeight: 42,
        },
        subtitle: {
            fontSize: theme.font.size.lg,
            color: theme.color.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
        },
        footer: {
            paddingHorizontal: theme.space.xl,
            paddingBottom: theme.space.xxl,
            gap: theme.space.xxl,
        },
        pagination: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: theme.space.sm,
        },
        dot: {
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.color.accent,
        },
        nextButton: {
            backgroundColor: theme.color.surface,
            paddingVertical: theme.space.lg,
            borderRadius: 16,
            alignItems: 'center',
        },
        nextText: {
            fontSize: theme.font.size.lg,
            color: theme.color.textPrimary,
        },
    });
