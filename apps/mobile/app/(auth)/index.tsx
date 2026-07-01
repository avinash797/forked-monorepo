import { ThemedButton } from '@/components/themed-button';
import { useTheme } from '@/contexts/theme-provider';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
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
        title: {
            before: 'Rank ',
            highlighted: 'Dishes',
            after: ', Not Restaurants',
        },
        subtitle: "Because a 3-star dive can have the best po'boy in the city.",
    },
    {
        title: {
            before: 'Ditch the ',
            highlighted: 'Stars',
            after: ', Choose the Winner',
        },
        subtitle: 'Play a fast, head-to-head game. Which dish actually wins?',
    },
    {
        title: {
            before: 'Snap a ',
            highlighted: 'Photo',
            after: ' to Prove It',
        },
        subtitle:
            "No fake ratings. If you didn't take a picture, you weren't there.",
    },
    {
        title: {
            before: 'Find the ',
            highlighted: 'Definitive',
            after: ' List',
        },
        subtitle: 'See the #1 ranked dishes near you in under 30 seconds.',
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
                <View>
                    <ThemedButton onPress={handleNext}>
                        {currentIndex === 0 ? 'Get Started' : 'Continue'}
                    </ThemedButton>
                    {currentIndex === 0 && (
                        <ThemedButton
                            variant="text"
                            onPress={handleSkip}
                            style={styles.skipButton}
                        >
                            I already have an account
                        </ThemedButton>
                    )}
                </View>
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
                <Text style={styles.title}>
                    <Text style={styles.titleBefore}>{item.title.before}</Text>
                    <Text style={styles.titleHighlighted}>
                        {item.title.highlighted}
                    </Text>
                    <Text style={styles.titleAfter}>{item.title.after}</Text>
                </Text>
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
            marginTop: theme.space.sm,
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
        title: {
            fontSize: theme.font.size.xxl,
            textAlign: 'center',
            marginBottom: theme.space.lg,
            lineHeight: 42,
        },
        titleBefore: {
            color: theme.color.textPrimary,
        },
        titleHighlighted: {
            color: theme.color.accent,
            textDecorationLine: 'underline',
            fontStyle: 'italic',
            fontWeight: '600',
        },
        titleAfter: {
            color: theme.color.textPrimary,
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
        nextText: {
            fontSize: theme.font.size.lg,
            color: theme.color.textPrimary,
        },
    });
