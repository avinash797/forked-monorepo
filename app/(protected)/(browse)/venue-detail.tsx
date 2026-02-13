import { DishCardWithRating } from '@/components/browse/dish-card-with-rating';
import { EmptyState } from '@/components/browse/empty-state';
import { SectionHeader } from '@/components/browse/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useLocation } from '@/hooks/use-location';
import { useRestaurantDetail } from '@/hooks/use-restaurant-detail';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 450;
const HEADER_HEIGHT = 60;

const AnimatedIconSymbol = Animated.createAnimatedComponent(IconSymbol);

export default function VenueDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { venueId, source } = useLocalSearchParams<{
        venueId: string;
        source: string;
    }>();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, insets);

    const { data, isLoading, error } = useRestaurantDetail(venueId);
    const { venue, dishes = [] } = data || {};
    const allPhotos = dishes.flatMap((dish) => dish.photos);
    const { data: locationData } = useLocation();
    const location = locationData?.location;

    const dishTypesServed = new Set(dishes.map((dish) => dish.dish_types.name));

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

    // Animated styles for hero
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
            [1.1, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT],
            [0, HERO_HEIGHT * 0.4],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }, { translateY }],
        };
    });

    // Animated style for sticky header
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

    const animatedBackButtonStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [0.3, 0],
            Extrapolation.CLAMP
        );

        return {
            backgroundColor: `rgba(0,0,0,${backgroundColor})`,
        };
    });

    // Navigate to dish detail
    const handleDishPress = (dishId: string) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: venue?.id,
                dishTypeId: dishId,
            },
        });
    };

    // Navigate to rating flow
    const handleAddDishPress = () => {
        router.push('/(protected)/(rating)');
    };

    const handleAddressPress = () => {
        if (venue?.google_place_id) {
            const query = encodeURIComponent(venue.name || 'Venue');
            const url = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${venue.google_place_id}`;
            Linking.openURL(url);
        }
    };

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
                    Loading venue...
                </ThemedText>
            </View>
        );
    }

    // Error state
    if (error || !venue) {
        return (
            <View
                style={[styles.container, { backgroundColor: theme.color.bg }]}
            >
                <EmptyState
                    icon="alert-circle-outline"
                    title="Unable to load venue"
                    message={
                        error?.message ||
                        'This venue may no longer be available.'
                    }
                    actionLabel="Go Back"
                    onActionPress={() => router.back()}
                />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Hero Control (Back Button) */}
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
                            {venue.name}
                        </ThemedText>
                    </View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Animated Hero Carousel */}
                <Animated.View style={[styles.heroSection, animatedHeroStyle]}>
                    {allPhotos.length > 0 ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={StyleSheet.absoluteFill}
                        >
                            {allPhotos.map((photoUrl, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photoUrl! }}
                                    style={{
                                        width: width,
                                        height: HERO_HEIGHT,
                                    }}
                                    contentFit="cover"
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: theme.color.surface },
                            ]}
                        />
                    )}

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

                    <View style={styles.heroContent}>
                        <ThemedText
                            style={styles.venueNameHero}
                            numberOfLines={2}
                        >
                            {venue.name}
                        </ThemedText>

                        <View style={styles.metaRowHero}>
                            <View style={styles.cuisinesContainer}>
                                {dishTypesServed &&
                                    [...dishTypesServed].map(
                                        (dishType, index) => (
                                            <ThemedText
                                                key={index}
                                                style={styles.cuisineTextHero}
                                            >
                                                {index > 0 ? ' • ' : ''}
                                                {dishType}
                                            </ThemedText>
                                        )
                                    )}
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    <View style={styles.infoBox}>
                        <Pressable onPress={handleAddressPress}>
                            <View style={styles.addressRow}>
                                <IconSymbol
                                    name="location-sharp"
                                    size={20}
                                    color={theme.color.textTertiary}
                                />
                                <View style={styles.addressTextContainer}>
                                    <ThemedText style={styles.addressText}>
                                        {venue.address}
                                    </ThemedText>
                                </View>
                            </View>
                        </Pressable>
                    </View>

                    {/* Dishes Section */}
                    <View style={styles.dishesSection}>
                        <SectionHeader
                            title={`Menu (${dishes.length})`}
                            subtitle={
                                dishes.length === 0
                                    ? 'No dishes rated yet'
                                    : undefined
                            }
                        />

                        {dishes.length === 0 ? (
                            <View style={styles.emptyDishes}>
                                <EmptyState
                                    icon="restaurant-outline"
                                    title="No dishes yet"
                                    message="Be the first to rate a dish here!"
                                    actionLabel="Add a Dish"
                                    onActionPress={handleAddDishPress}
                                />
                            </View>
                        ) : (
                            <View style={styles.dishesList}>
                                {dishes.map((dish) => (
                                    <DishCardWithRating
                                        key={`${dish.dish_type_id}-${dish.variation_id}`}
                                        dish={dish}
                                        onPress={() =>
                                            handleDishPress(dish.dish_type_id)
                                        }
                                        viewMode="horizontal"
                                    />
                                ))}
                            </View>
                        )}
                    </View>
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
        heroContent: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: theme.space.md,
            paddingBottom: theme.space.lg + 20,
        },
        venueNameHero: {
            fontSize: theme.font.size.xxl + 8,
            lineHeight: theme.font.size.xxl + 14,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textOnImage,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
        },
        metaRowHero: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
        },
        cuisinesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        cuisineTextHero: {
            fontSize: theme.font.size.md,
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: theme.font.weight.medium,
        },
        priceHero: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textOnImage,
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
            marginLeft: 44,
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
        headerBadge: {
            transform: [{ scale: 0.9 }],
        },
        contentSection: {
            backgroundColor: theme.color.bg,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            marginTop: -theme.radius.xl,
            minHeight: height,
            paddingTop: theme.space.lg,
        },
        infoBox: {
            marginHorizontal: theme.space.md,
            padding: theme.space.md,
            backgroundColor: theme.color.surface2 + '40',
            borderRadius: theme.radius.lg,
            marginBottom: theme.space.lg,
        },
        addressRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: theme.space.sm,
        },
        addressTextContainer: {
            flex: 1,
        },
        addressText: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.medium,
            color: theme.color.textPrimary,
        },
        addressSubtext: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        distanceTag: {
            paddingHorizontal: theme.space.xs,
            paddingVertical: 2,
            backgroundColor: theme.color.accent + '20',
            borderRadius: theme.radius.xs,
        },
        distanceText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.bold,
            color: theme.color.accent,
        },
        dishesSection: {
            marginTop: theme.space.xs,
        },
        dishesList: {
            paddingHorizontal: theme.space.md,
            gap: theme.space.md,
        },
        emptyDishes: {
            paddingVertical: theme.space.xxl,
        },
    });
