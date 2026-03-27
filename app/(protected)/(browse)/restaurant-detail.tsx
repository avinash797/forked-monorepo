import { DishCardWithRating } from '@/components/browse/dish-card-with-rating';
import { EmptyState } from '@/components/browse/empty-state';
import { ReportPhotoModal } from '@/components/browse/report-photo-modal';
import { SectionHeader } from '@/components/browse/section-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useRestaurantDetail } from '@/hooks/use-restaurant-detail';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Linking, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ImageViewing from 'react-native-image-viewing';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 450;
const HEADER_HEIGHT = 60;

// Generic Google place types that add no useful info
const GENERIC_TYPES = new Set([
    'point_of_interest',
    'establishment',
    'food',
    'restaurant',
    'premise',
    'geocode',
]);

function formatPlaceTypes(types: string[] | null): string[] {
    if (!types) return [];
    return types
        .filter((t) => !GENERIC_TYPES.has(t))
        .map((t) =>
            t
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
        )
        .slice(0, 3); // cap at 3 to avoid clutter
}


// ── Skeleton placeholder with pulsing animation ─────────────────────────
function SkeletonBlock({
    width,
    height,
    borderRadius,
    style,
}: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: borderRadius ?? 8,
                    backgroundColor: 'rgba(150,150,150,0.2)',
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

// ── Skeleton for a dish card row ────────────────────────────────────────
function DishCardSkeleton() {
    return (
        <View
            style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
            }}
        >
            <SkeletonBlock width={80} height={80} borderRadius={12} />
            <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock width="70%" height={16} borderRadius={4} />
                <SkeletonBlock width="45%" height={14} borderRadius={4} />
                <SkeletonBlock width="30%" height={14} borderRadius={4} />
            </View>
        </View>
    );
}

export default function RestaurantDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { venueId, source } = useLocalSearchParams<{
        venueId: string;
        source: string;
    }>();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, insets);

    const { data, isLoading, error } = useRestaurantDetail(venueId);
    const { venue, dishes = [], photoRatingMap = {} } = data || {};
    const allPhotos = dishes.flatMap((dish) => dish.photos).filter((p): p is string => p != null);

    // Report photo state
    const [reportRatingId, setReportRatingId] = useState<string | null>(null);
    // Fullscreen photo viewer state
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    const handleReportHeroPhoto = (photoUrl: string) => {
        const ratingId = photoRatingMap[photoUrl];
        if (ratingId) {
            setReportRatingId(ratingId);
        } else {
            Alert.alert(
                'Unable to Report',
                'This photo cannot be reported at this time.'
            );
        }
    };
    const scrollViewRef = useRef<ScrollView>(null);

    const dishTypesServed = new Set(dishes.map((dish) => dish.type.name));

    useEffect(() => {
        if (!isLoading && allPhotos.length > 1) {
            const timeout1 = setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: 60, animated: true });
            }, 500);

            const timeout2 = setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: 0, animated: true });
            }, 1200);

            return () => {
                clearTimeout(timeout1);
                clearTimeout(timeout2);
            };
        }
    }, [isLoading, allPhotos.length]);

    // Animation values
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Cross-fade between light and dark icon as user scrolls
    const animatedLightIconStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [1, 0],
            Extrapolation.CLAMP
        ),
    }));

    const animatedDarkIconStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.7, HERO_HEIGHT * 0.9],
            [0, 1],
            Extrapolation.CLAMP
        ),
    }));

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
            [HERO_HEIGHT * 0.8, HERO_HEIGHT * 0.95],
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
                        [-1, 0],
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

    const handlePhonePress = () => {
        if (venue?.phone) {
            Linking.openURL(`tel:${venue.phone}`);
        }
    };

    const handleWebsitePress = () => {
        if (venue?.website) {
            Linking.openURL(venue.website);
        }
    };

    // Loading state – skeleton UI
    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                {/* Back button always available */}
                <View style={[styles.topControls, { marginTop: insets.top }]}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                        <View style={styles.backButton}>
                            <IconSymbol
                                name="arrow-back"
                                size={24}
                                color={theme.color.textOnImage}
                            />
                        </View>
                    </Pressable>
                </View>

                {/* Hero skeleton */}
                <SkeletonBlock
                    width="100%"
                    height={HERO_HEIGHT}
                    borderRadius={0}
                />

                {/* Content skeleton – mirrors the rounded card */}
                <View style={[styles.contentSection, { minHeight: undefined }]}>
                    {/* Venue name – two large lines */}
                    <View style={styles.venueHeader}>
                        <SkeletonBlock
                            width="80%"
                            height={38}
                            borderRadius={6}
                            style={{ marginBottom: 8 }}
                        />
                        <SkeletonBlock
                            width="55%"
                            height={38}
                            borderRadius={6}
                            style={{ marginBottom: 12 }}
                        />

                        {/* Place types row  e.g. "Steak House • Fine Dining • Bar" */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 10,
                            }}
                        >
                            <SkeletonBlock
                                width={90}
                                height={15}
                                borderRadius={4}
                            />
                            <SkeletonBlock
                                width={4}
                                height={4}
                                borderRadius={2}
                            />
                            <SkeletonBlock
                                width={130}
                                height={15}
                                borderRadius={4}
                            />
                            <SkeletonBlock
                                width={4}
                                height={4}
                                borderRadius={2}
                            />
                            <SkeletonBlock
                                width={36}
                                height={15}
                                borderRadius={4}
                            />
                        </View>

                        {/* Neighborhood pill */}
                        <SkeletonBlock
                            width={170}
                            height={26}
                            borderRadius={13}
                            style={{ marginBottom: 8 }}
                        />

                        {/* Dish type pill */}
                        <SkeletonBlock
                            width={68}
                            height={26}
                            borderRadius={6}
                        />
                    </View>

                    {/* Action icon buttons (globe / phone / location) */}
                    <View style={[styles.infoBox, { gap: theme.space.xs }]}>
                        <SkeletonBlock
                            width={40}
                            height={40}
                            borderRadius={20}
                        />
                        <SkeletonBlock
                            width={40}
                            height={40}
                            borderRadius={20}
                        />
                        <SkeletonBlock
                            width={40}
                            height={40}
                            borderRadius={20}
                        />
                    </View>

                    {/* Menu section */}
                    <View
                        style={[styles.dishesSection, { alignSelf: 'stretch' }]}
                    >
                        <SkeletonBlock
                            width={120}
                            height={22}
                            borderRadius={6}
                            style={{ marginLeft: 16, marginBottom: 16 }}
                        />
                        <View style={styles.dishesList}>
                            <DishCardSkeleton />
                            <DishCardSkeleton />
                        </View>
                    </View>
                </View>
            </ThemedView>
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
            {/* Hero Control (Back Button) */}
            <View style={[styles.topControls, { marginTop: insets.top }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                >
                    <Animated.View
                        style={[styles.backButton, animatedBackButtonStyle]}
                    >
                        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, animatedLightIconStyle]}>
                            <IconSymbol name="arrow-back" size={24} color={theme.color.textOnImage} />
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, animatedDarkIconStyle]}>
                            <IconSymbol name="arrow-back" size={24} color={theme.color.textPrimary} />
                        </Animated.View>
                    </Animated.View>
                </Pressable>
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
                            ref={scrollViewRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={StyleSheet.absoluteFill}
                        >
                            {allPhotos.map((photoUrl, index) => (
                                <Pressable
                                    key={index}
                                    onPress={() => setViewerIndex(index)}
                                >
                                    <Image
                                        source={{ uri: photoUrl! }}
                                        style={{
                                            width: width,
                                            height: HERO_HEIGHT,
                                        }}
                                        contentFit="cover"
                                    />
                                </Pressable>
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
                        pointerEvents="none"
                    />

                </Animated.View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    {/* Closed Warning Banner */}
                    {venue.is_closed && (
                        <View style={styles.closedBanner}>
                            <IconSymbol
                                name="alert-circle-outline"
                                size={16}
                                color="#fff"
                            />
                            <ThemedText style={styles.closedBannerText}>
                                Permanently Closed
                            </ThemedText>
                        </View>
                    )}

                    <View style={styles.venueHeader}>
                        {/* Name row with verified badge */}
                        <ScrollView contentContainerStyle={styles.dishTypesRow} horizontal showsHorizontalScrollIndicator={false}>
                            {[...dishTypesServed].map((dishType, index) => (
                                <View key={index} style={styles.dishTypePill}>
                                    <ThemedText style={styles.dishTypeText}>
                                        {dishType}
                                    </ThemedText>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.nameRow}>
                            <ThemedText
                                type="title"
                                style={styles.venueName}
                                numberOfLines={2}
                            >
                                {venue.name}
                            </ThemedText>
                            {venue.is_verified && (
                                <View style={styles.verifiedBadge}>
                                    <IconSymbol
                                        name="checkmark-circle"
                                        size={18}
                                        color={theme.color.accent}
                                    />
                                </View>
                            )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>

                            {/* Google place type pills */}
                            {formatPlaceTypes(venue.types).length > 0 && (
                                <View style={styles.placeTypesRow}>
                                    {formatPlaceTypes(venue.types).map(
                                        (t, index) => (
                                            <ThemedText
                                                key={index}
                                                style={styles.cuisineText}
                                            >
                                                {index > 0 ? ' • ' : ''}
                                                {t}
                                            </ThemedText>
                                        )
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        {/* Neighborhood + dish types row */}
                        <View style={styles.cuisinesContainer}>

                            <Pressable
                                onPress={handleAddressPress}
                                style={styles.neighborhoodPill}
                            >
                                <IconSymbol
                                    name="location-outline"
                                    size={12}
                                    color={theme.color.accent}
                                />
                                {venue.neighborhood?.name && <ThemedText
                                    style={styles.neighborhoodText}
                                >
                                    {venue.neighborhood.name},{" "}
                                </ThemedText>}
                                {venue.location_properties && <ThemedText
                                    style={styles.neighborhoodText}
                                >
                                    {venue.location_properties.city},{" "}
                                </ThemedText>}
                                {venue.location_properties && <ThemedText
                                    style={styles.neighborhoodText}
                                >
                                    {venue.location_properties.state}
                                </ThemedText>}
                                {!venue.neighborhood?.name && !venue.location_properties && <ThemedText
                                    style={styles.neighborhoodText}
                                >
                                    {venue.address}
                                </ThemedText>}
                            </Pressable>

                        </View>

                    </View>

                    <View style={styles.infoBox}>
                        {venue.phone && (
                            <ThemedButton
                                variant="secondary"
                                onPress={handlePhonePress}
                                style={styles.infoButton}
                                icon={
                                    <IconSymbol
                                        name="call-outline"
                                        size={22}
                                        color={theme.color.textSecondary}
                                    />
                                }
                            >
                                <ThemedText style={styles.infoButtonText}>Phone</ThemedText>
                            </ThemedButton>
                        )}
                        {venue.website && (
                            <ThemedButton
                                variant="secondary"
                                onPress={handleWebsitePress}
                                style={styles.infoButton}
                                icon={
                                    <IconSymbol
                                        name="globe-outline"
                                        size={22}
                                        color={theme.color.textSecondary}
                                    />
                                }
                            >
                                <ThemedText style={styles.infoButtonText}>Website</ThemedText>
                            </ThemedButton>
                        )}
                    </View>

                    {/* Dishes Section */}
                    <View style={styles.dishesSection}>
                        <SectionHeader
                            title={`Dishes Rated (${dishes.length})`}
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
                                        key={dish.dish_type_id}
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

            <ImageViewing
                images={allPhotos.map((uri) => ({ uri }))}
                imageIndex={viewerIndex ?? 0}
                visible={viewerIndex !== null}
                onRequestClose={() => setViewerIndex(null)}
                animationType="fade"
                FooterComponent={({ imageIndex }: { imageIndex: number }) => (
                    <View style={styles.viewerFooter}>
                        <Pressable
                            onPress={() => {
                                setViewerIndex(null);
                                handleReportHeroPhoto(allPhotos[imageIndex]);
                            }}
                            style={({ pressed }) => [
                                styles.reportButton,
                                pressed && { opacity: 0.7 },
                            ]}
                            hitSlop={8}
                        >
                            <IconSymbol
                                name="flag-outline"
                                size={16}
                                color="#fff"
                            />
                            <ThemedText style={styles.reportText}>
                                Report
                            </ThemedText>
                        </Pressable>
                    </View>
                )}
            />

            <ReportPhotoModal
                visible={reportRatingId !== null}
                ratingId={reportRatingId}
                onClose={() => setReportRatingId(null)}
            />
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
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
            borderCurve: 'continuous',
            marginTop: -theme.radius.xl,
            minHeight: Dimensions.get('window').height - HERO_HEIGHT,
            paddingTop: theme.space.lg,
            flex: 1,
            alignItems: 'center',
        },
        venueHeader: {
            alignSelf: 'stretch',
            paddingHorizontal: theme.space.md,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: theme.space.xs,
            marginBottom: 4,
        },
        venueName: {
            fontSize: theme.font.size.xxl + 6,
            flex: 1,
        },
        verifiedBadge: {
            marginTop: 6,
        },
        cuisinesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: theme.space.xs,
        },
        neighborhoodPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: theme.color.accent + '18',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: theme.radius.pill,
        },
        neighborhoodText: {
            fontSize: theme.font.size.sm,
            color: theme.color.accent,
            fontWeight: theme.font.weight.semibold,
        },
        cuisineSeparator: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        cuisineText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            fontWeight: theme.font.weight.medium,
        },
        placeTypesRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: theme.space.xs,
        },
        dishTypesRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.xs,
            marginBottom: theme.space.xs,
        },
        dishTypePill: {
            backgroundColor: theme.color.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.border,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.space.xs,
            paddingVertical: 2,
        },
        dishTypeText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        closedBanner: {
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
            backgroundColor: '#c0392b',
            marginHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
        },
        closedBannerText: {
            color: '#fff',
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.bold,
        },
        infoBox: {
            alignSelf: 'flex-start',
            marginLeft: theme.space.md,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            marginBottom: theme.space.md,
            flexDirection: 'row',
            gap: theme.space.xxs,
        },
        infoButton: {
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.space.xs,
            paddingVertical: theme.space.xxs,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.inputBorder,
        },
        infoButtonText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        addressRow: {
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
        },
        addressText: {
            flex: 1,
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
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
        viewerFooter: {
            alignItems: 'center',
            paddingBottom: 40,
        },
        reportButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
        },
        reportText: {
            color: '#fff',
            fontSize: theme.font.size.sm,
        },
    });
