import { EmptyState } from '@/components/browse/empty-state';
import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useDishDetail } from '@/hooks/use-dish-detail';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    interpolateColor,
    useAnimatedProps,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 450;
const HEADER_HEIGHT = 60;

const AnimatedIconSymbol = Animated.createAnimatedComponent(IconSymbol);

export default function DishDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { restaurantId, dishTypeId } = useLocalSearchParams<{
        restaurantId: string;
        dishTypeId: string;
    }>();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, insets);

    const {
        data: dish,
        isLoading,
        error,
    } = useDishDetail(dishTypeId, restaurantId);
    const venue = dish?.restaurant;

    // Animation values
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Animated props for the back button color
    const animatedIconProps = useAnimatedProps(() => {
        const color = interpolateColor(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [theme.color.textOnImage, theme.color.textPrimary]
        );

        return { color };
    });

    // Animated styles for hero image
    const animatedHeroStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.8],
            [1, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-100, 0],
            [1.2, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT],
            [0, HERO_HEIGHT * 0.5],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }, { translateY }],
        };
    });

    // Animated styles for hero text/content
    const animatedHeroContentStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.6],
            [1, 0],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.6],
            [0, -20],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    // Animated style for the sticky header
    const animatedHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [0, 1],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
                        [-10, 0],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    // Animated style for back button container background
    const animatedBackButtonStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [0.3, 0], // bg opacity of the circle
            Extrapolation.CLAMP
        );

        return {
            backgroundColor: `rgba(0,0,0,${backgroundColor})`,
        };
    });

    // Navigate to venue detail
    const handleVenuePress = () => {
        if (venue && venue.id) {
            router.push({
                pathname: '/(protected)/(browse)/venue-detail',
                params: { venueId: venue.id },
            });
        }
    };

    // Navigate to rating flow
    const handleRateDishPress = () => {
        router.push('/(protected)/(rating)');
    };

    const heroPhoto = dish?.featured_photo_url;

    // Loading state
    if (isLoading) {
        return (
            <View
                style={[
                    styles.loadingContainer,
                    { backgroundColor: theme.color.bg },
                ]}
            >
                <ActivityIndicator size="large" />
                <ThemedText style={styles.loadingText}>
                    Loading dish details...
                </ThemedText>
            </View>
        );
    }

    // Error state
    if (error || !dish) {
        return (
            <View
                style={[styles.container, { backgroundColor: theme.color.bg }]}
            >
                <EmptyState
                    icon="alert-circle-outline"
                    title="Unable to load dish"
                    message={
                        error?.message ||
                        'This dish may no longer be available.'
                    }
                    actionLabel="Go Back"
                    onActionPress={() => router.back()}
                />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Hero Control (Back Button always visible but transitions) */}
            <View style={[styles.topControls, { marginTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Animated.View
                        style={[styles.backButton, animatedBackButtonStyle]}
                    >
                        <AnimatedIconSymbol
                            name="arrow-back"
                            size={24}
                            color={theme.color.textOnImage}
                            animatedProps={animatedIconProps}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Animated Sticky Header */}
            <Animated.View
                style={[
                    styles.stickyHeader,
                    { paddingTop: insets.top },
                    animatedHeaderStyle,
                ]}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText
                            style={styles.headerTitle}
                            numberOfLines={1}
                        >
                            {dish.dish_type.name}
                        </ThemedText>
                        <ThemedText
                            style={styles.headerSubtitle}
                            numberOfLines={1}
                        >
                            at {venue?.name}
                        </ThemedText>
                    </View>
                    {dish.avg_raw_score !== null && (
                        <ScoreBadge
                            score={dish.avg_raw_score}
                            style={styles.headerRating}
                        />
                    )}
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Animated Hero Section */}
                <Animated.View style={[styles.heroSection, animatedHeroStyle]}>
                    {heroPhoto ? (
                        <Image
                            source={{ uri: heroPhoto }}
                            style={styles.heroImage}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <View
                            style={[
                                styles.heroImage,
                                { backgroundColor: theme.color.surface },
                            ]}
                        />
                    )}

                    {/* Gradients */}
                    <LinearGradient
                        colors={[
                            'rgba(0,0,0,0.5)',
                            'transparent',
                            'transparent',
                            'rgba(0,0,0,0.9)',
                        ]}
                        locations={[0, 0.2, 0.5, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Hero Content Overlay */}
                    <Animated.View
                        style={[styles.heroContent, animatedHeroContentStyle]}
                    >
                        <View style={styles.statsRow}>
                            <View style={{ maxWidth: '90%' }}>
                                <ThemedText style={styles.dishNameHero}>
                                    {dish.dish_type.name}
                                </ThemedText>

                                <TouchableOpacity
                                    onPress={handleVenuePress}
                                    activeOpacity={0.7}
                                    style={styles.venueNameContainer}
                                >
                                    <ThemedText style={styles.venueNameHero}>
                                        at {dish.restaurant.name}{' '}
                                    </ThemedText>
                                    <IconSymbol
                                        name="arrow-forward-sharp"
                                        color={theme.color.textOnImage}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.ratingContainer}>
                                {dish.avg_raw_score !== null &&
                                    dish.total_ratings! > 0 && (
                                        <ScoreBadge
                                            score={dish.avg_raw_score}
                                            style={styles.ratingBadge}
                                        />
                                    )}
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <ThemedText style={styles.statsText}>
                                {dish.total_ratings}{' '}
                                {dish.total_ratings === 1
                                    ? 'review'
                                    : 'reviews'}{' '}
                            </ThemedText>
                            {/* {dish.current_price && (
                                <ThemedText style={styles.priceHero}>
                                    ${dish.current_price.toFixed(0)}
                                </ThemedText>
                            )} */}
                        </View>
                    </Animated.View>
                </Animated.View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    {/* Detailed Info */}
                    <View style={styles.infoSection}>
                        {/* Dietary Tags */}
                        {dish.tags && dish.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {dish.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <ThemedText style={styles.tagText}>
                                            {tag.name}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Description */}
                        {/* {dish.description && (
                            <ThemedText style={styles.description}>
                                {dish.description}
                            </ThemedText>
                        )} */}
                    </View>

                    {/* Rate This Dish Button (if reviews exist) */}
                    {/* {reviews.length > 0 && (
                        <View style={styles.rateButtonContainer}>
                            <ThemedButton
                                onPress={handleRateDishPress}
                                style={styles.rateButton}
                            >
                                Rate This Dish
                            </ThemedButton>
                        </View>
                    )} */}
                </View>
            </Animated.ScrollView>
        </ThemedView>
    );
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: any
) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: insets.bottom + theme.space.xl,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            marginTop: theme.space.md,
            opacity: theme.opacity.pressed,
        },
        heroSection: {
            height: HERO_HEIGHT,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
        },
        heroImage: {
            width: '100%',
            height: HERO_HEIGHT,
        },
        topControls: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.sm,
            zIndex: 20,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        stickyHeader: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.color.surface,
            zIndex: 15,
            height: HEADER_HEIGHT + insets.top,
            justifyContent: 'center',
            paddingHorizontal: theme.space.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 44, // Align past back button
        },
        headerTitleContainer: {
            flex: 1,
        },
        headerTitle: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        headerSubtitle: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
        },
        headerRating: {
            marginLeft: theme.space.sm,
            transform: [{ scale: 0.9 }],
        },

        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
        },
        trendBadgeHero: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingHorizontal: theme.space.sm,
            paddingVertical: theme.space.xs,
            borderRadius: theme.radius.md,
        },
        ratingBadge: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
        heroContent: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: theme.space.md,
            paddingBottom: theme.space.lg + 20, // Add space for the overlap
        },
        dishNameHero: {
            fontSize: theme.font.size.xxl + 6,
            lineHeight: theme.font.size.xxl + 12,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textOnImage,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
            marginBottom: 2,
        },
        venueNameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.sm,
        },
        venueNameHero: {
            fontSize: theme.font.size.lg,
            color: theme.color.textOnImage,
            opacity: 0.9,
            fontWeight: theme.font.weight.medium,
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        statsText: {
            fontSize: theme.font.size.md,
            color: theme.color.textOnImage,
            opacity: 0.8,
            fontWeight: theme.font.weight.medium,
        },
        priceHero: {
            fontSize: theme.font.size.xl,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textOnImage,
        },
        contentSection: {
            backgroundColor: theme.color.bg,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            marginTop: -theme.radius.xl,
            minHeight: Dimensions.get('window').height,
            padding: theme.space.sm,
            paddingTop: theme.space.lg,
        },
        infoSection: {
            marginBottom: theme.space.lg,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.xs,
            marginBottom: theme.space.md,
        },
        tag: {
            paddingHorizontal: theme.space.sm,
            paddingVertical: theme.space.xxs + 2,
            borderRadius: theme.radius.pill,
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
            borderWidth: 1,
            borderColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)',
        },
        tagText: {
            fontSize: theme.font.size.xs + 1,
            color: theme.color.textSecondary,
            fontWeight: theme.font.weight.semibold,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        description: {
            fontSize: theme.font.size.md,
            lineHeight: theme.font.line.md,
            color: theme.color.textSecondary,
        },
        photoGallerySection: {
            marginBottom: theme.space.lg,
        },
        reviewsSection: {
            paddingTop: theme.space.xs,
        },
        emptyReviews: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
        },
        rateButtonContainer: {
            paddingHorizontal: theme.space.md,
            marginTop: theme.space.md,
        },
        rateButton: {
            borderRadius: theme.radius.lg,
        },
    });
