import { EmptyState } from '@/components/browse/empty-state';
import { PhotoGallery } from '@/components/browse/photo-gallery';
import { ReportPhotoModal } from '@/components/browse/report-photo-modal';
import { ScoreBadge } from '@/components/score-badge';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDishDetail } from '@/hooks/use-dish-detail';
import { useRatingStore } from '@/stores';
import { Restaurant } from '@/types/restaurant';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
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

const HERO_HEIGHT = 320;
const HEADER_HEIGHT = 60;

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

// ── Skeleton for the tags section ───────────────────────────────────────
function TagsSkeleton() {
    return (
        <View
            style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 12,
            }}
        >
            {[80, 60, 90, 50, 70].map((w, i) => (
                <SkeletonBlock
                    key={i}
                    width={w}
                    height={26}
                    borderRadius={20}
                />
            ))}
        </View>
    );
}

// ── Skeleton for the photo gallery ──────────────────────────────────────
function PhotoGallerySkeleton() {
    return (
        <View
            style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                marginVertical: 6,
            }}
        >
            {[1, 2, 3].map((i) => (
                <SkeletonBlock
                    key={i}
                    width="31%"
                    height={100}
                    borderRadius={6}
                    style={{ aspectRatio: 1 }}
                />
            ))}
        </View>
    );
}

// ── Skeleton button ─────────────────────────────────────────────────────
function ButtonSkeleton() {
    return <SkeletonBlock width="100%" height={48} borderRadius={12} />;
}

export default function DishDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { restaurantId, dishTypeId } = useLocalSearchParams<{
        restaurantId: string;
        dishTypeId: string;
    }>();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme, insets);
    const { user } = useAuth();

    // Split hooks – core loads first, menu & ratings load independently
    const { core, menu, ratings } = useDishDetail(dishTypeId, restaurantId);

    const coreData = core.data;
    const venue = coreData?.restaurant as Restaurant | undefined;

    // Secondary data
    const menuData = menu.data;
    const ratingsData = ratings.data;

    // Report photo state
    const [reportRatingId, setReportRatingId] = useState<string | null>(null);

    const handleReportPhoto = (photoUrl: string) => {
        if (menuData?.photoUserMap?.[photoUrl] === user?.id) return;
        const ratingId = menuData?.photoRatingMap?.[photoUrl];
        if (ratingId) {
            setReportRatingId(ratingId);
        } else {
            Alert.alert(
                'Unable to Report',
                'This photo cannot be reported at this time.'
            );
        }
    };


    // Rating store for pre-populating when user wants to rate this dish
    const { setSelectedRestaurant, setSelectedDishType, resetRating } =
        useRatingStore();

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
                pathname: '/(protected)/(browse)/restaurant-detail',
                params: { venueId: venue.id, source: 'dish-detail' },
            });
        }
    };

    // Navigate to rating flow with pre-populated restaurant and dish type
    const handleRateDishPress = () => {
        if (coreData && venue) {
            if (ratingsData?.userRatingData) {
                Alert.alert(
                    'Update Your Rating',
                    `You previously rated this ${coreData.dish_type.name} as ${ratingsData.userRatingData.sentiment}. Has your opinion changed?`,
                    [
                        {
                            text: 'No',
                            style: 'cancel',
                        },
                        {
                            text: 'Yes',
                            style: 'default',
                            onPress: async () => {
                                resetRating();
                                setSelectedRestaurant(venue);
                                setSelectedDishType(coreData.dish_type);
                                router.push('/(protected)/(rating)/rating');
                            },
                        },
                    ]
                );
            } else {
                resetRating();
                setSelectedRestaurant(venue);
                setSelectedDishType(coreData.dish_type);
                router.push('/(protected)/(rating)/rating');
            }
        }
    };

    // Build dynamic user rating summary as rich text
    const userRating = ratingsData?.userRatingData;
    const buildRatingSummary = (): React.ReactNode | null => {
        if (!userRating || !coreData) return null;

        const sentimentVerb =
            userRating.sentiment === 'liked'
                ? 'liked'
                : userRating.sentiment === 'disliked'
                    ? "didn't like"
                    : 'thought was okay';

        const dishName = coreData.dish_type.name.toLowerCase();

        const tagNames = userRating.tags
            ?.map((t: any) => t.taste_tags?.name)
            .filter(Boolean) as string[];

        const bold = (text: string) => (
            <ThemedText style={styles.ratingSummaryBold}>{text}</ThemedText>
        );

        const hasTagNames = tagNames && tagNames.length > 0;
        const formattedTags = hasTagNames
            ? tagNames.length === 1
                ? tagNames[0]
                : tagNames.length === 2
                    ? `${tagNames[0]} and ${tagNames[1]}`
                    : `${tagNames.slice(0, -1).join(', ')}, and ${tagNames[tagNames.length - 1]}`
            : null;

        return (
            <ThemedText style={styles.ratingSummaryText}>
                {'You '}
                {userRating.sentiment !== 'okay' ? bold(sentimentVerb) : 'thought'}
                {` this `}
                {bold(dishName)}
                {userRating.sentiment === 'okay' && ' was '}{userRating.sentiment === 'okay' && bold('just okay')}
                {formattedTags && (
                    <>
                        {', and described it as '}
                        {bold(formattedTags)}
                    </>
                )}
                {'.'}
                {userRating.notes && (
                    <>
                        {' You noted: "'}
                        {bold(userRating.notes)}
                        {'"'}
                    </>
                )}
            </ThemedText>
        );
    };

    const ratingSummary = buildRatingSummary();

    const heroPhoto = coreData?.featured_photo_url;

    // Primary loading state — only block on core data
    if (core.isLoading) {
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
                {/* Content skeleton */}
                <View style={styles.contentSection}>
                    <View>
                        <SkeletonBlock
                            width="70%"
                            height={28}
                            borderRadius={6}
                            style={{ marginBottom: 8 }}
                        />
                        <SkeletonBlock
                            width="50%"
                            height={18}
                            borderRadius={6}
                            style={{ marginBottom: 16 }}
                        />
                        <SkeletonBlock
                            width="100%"
                            height={60}
                            borderRadius={12}
                            style={{ marginBottom: 16 }}
                        />
                        <SkeletonBlock
                            width="30%"
                            height={18}
                            borderRadius={6}
                            style={{ marginBottom: 16 }}
                        />
                        <TagsSkeleton />
                        <SkeletonBlock
                            width="30%"
                            height={18}
                            borderRadius={6}
                            style={{ marginBottom: 16 }}
                        />
                        <TagsSkeleton />
                        <PhotoGallerySkeleton />
                    </View>
                    <View style={styles.rateButtonContainer}>
                        <ButtonSkeleton />
                    </View>
                </View>
            </ThemedView>
        );
    }

    // Error state
    if (core.error || !coreData) {
        return (
            <View
                style={[styles.container, { backgroundColor: theme.color.bg }]}
            >
                <EmptyState
                    icon="alert-circle-outline"
                    title="Unable to load dish"
                    message={
                        (core.error instanceof Error ? core.error.message : core.error) ||
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
                            {coreData.dish_type.name}
                        </ThemedText>
                        <ThemedText
                            style={styles.headerSubtitle}
                            numberOfLines={1}
                        >
                            at {venue?.name}
                        </ThemedText>
                    </View>
                    {coreData.bayesian_score !== null && (
                        <ScoreBadge
                            score={coreData.bayesian_score}
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
                        <View style={styles.statsRow}></View>
                    </Animated.View>
                </Animated.View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    <View>
                        <View style={styles.statsRow}>
                            <View style={{ maxWidth: '90%' }}>
                                <ThemedText
                                    type="title"
                                    style={styles.dishNameHero}
                                >
                                    {coreData.dish_type.name}
                                </ThemedText>

                                <Pressable
                                    onPress={handleVenuePress}
                                    style={({ pressed }) => [
                                        styles.venueNameContainer,
                                        pressed && { opacity: 0.7 },
                                    ]}
                                >
                                    <ThemedText
                                        type="subtitle"
                                        style={styles.venueNameHero}
                                        selectable
                                    >
                                        at {coreData.restaurant.name}{' '}
                                    </ThemedText>
                                    <IconSymbol
                                        name="chevron-forward"
                                        color={theme.color.textSecondary}
                                    />
                                </Pressable>
                            </View>
                            <View style={styles.ratingContainer}>
                                {coreData.bayesian_score !== null &&
                                    coreData.total_ratings! > 0 && (
                                        <ScoreBadge
                                            score={coreData.bayesian_score}
                                            style={styles.ratingBadge}
                                        />
                                    )}
                            </View>
                        </View>
                        {/* Detailed Info */}
                        <View style={styles.infoSection}>
                            <View style={styles.statCard}>
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {coreData.total_ratings || 0}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Ratings
                                    </ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {(coreData as any).bayesian_score?.toFixed(1) ?? '—'}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Score
                                    </ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {((coreData as any).confidence_tier ?? 'low').replace('_', ' ')}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Confidence
                                    </ThemedText>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.rateButtonContainer,
                                    userRating &&
                                    styles.rateButtonContainerRated,
                                ]}
                            >
                                {ratings.isLoading ? (
                                    <ButtonSkeleton />
                                ) : (
                                    <>
                                        {ratingSummary && (
                                            <View
                                                style={
                                                    styles.ratingSummaryContainer
                                                }
                                            >
                                                {ratingSummary}
                                            </View>
                                        )}
                                        <ThemedButton
                                            onPress={handleRateDishPress}
                                        >
                                            {userRating
                                                ? 'Update Rating'
                                                : 'Rate This Dish'}
                                        </ThemedButton>
                                    </>
                                )}
                            </View>

                            {menu.isLoading ? (
                                <TagsSkeleton />
                            ) : (
                                menuData?.variations &&
                                menuData.variations.length > 0 && (
                                    <>
                                        <ThemedText type="defaultSemiBold">
                                            Variations Offered
                                        </ThemedText>
                                        <View style={styles.tagsContainer}>
                                            {menuData.variations
                                                .sort(
                                                    (a, b) => b.count - a.count
                                                )
                                                .map((variation, index) => (
                                                    <View
                                                        key={index}
                                                        style={styles.tag}
                                                    >
                                                        <ThemedText
                                                            style={
                                                                styles.variationText
                                                            }
                                                        >
                                                            {variation}
                                                        </ThemedText>
                                                    </View>
                                                ))}
                                        </View>
                                    </>
                                )
                            )}

                            {/* Tags: skeleton while loading, real tags when ready */}
                            {ratings.isLoading ? (
                                <TagsSkeleton />
                            ) : (
                                ratingsData?.tags &&
                                ratingsData.tags.length > 0 && (
                                    <>
                                        <ThemedText type="defaultSemiBold">
                                            User Tags
                                        </ThemedText>
                                        <View style={styles.tagsContainer}>
                                            {ratingsData.tags
                                                .sort(
                                                    (a, b) => b.count - a.count
                                                )
                                                .map((tag, index) => (
                                                    <View
                                                        key={index}
                                                        style={styles.tag}
                                                    >
                                                        <ThemedText
                                                            style={
                                                                styles.tagText
                                                            }
                                                        >
                                                            {tag?.name}
                                                        </ThemedText>
                                                        <ThemedText
                                                            style={
                                                                styles.tagCountText
                                                            }
                                                        >
                                                            ({tag.count})
                                                        </ThemedText>
                                                    </View>
                                                ))}
                                        </View>
                                    </>
                                )
                            )}

                            {/* Photos: skeleton while loading, gallery when ready */}
                            {menu.isLoading ? (
                                <PhotoGallerySkeleton />
                            ) : (
                                menuData &&
                                menuData.photos.length > 0 && (
                                    <>
                                        <ThemedText type="defaultSemiBold">
                                            Community Photos
                                        </ThemedText>
                                        <PhotoGallery
                                            photos={[...menuData.photos]}
                                            onReportPhoto={handleReportPhoto}
                                        />
                                    </>
                                )
                            )}
                        </View>
                    </View>


                </View>
            </Animated.ScrollView>

            <ReportPhotoModal
                visible={reportRatingId !== null}
                ratingId={reportRatingId}
                onClose={() => setReportRatingId(null)}
                dishId={dishTypeId ?? undefined}
                restaurantId={restaurantId ?? undefined}
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
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
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
            marginBottom: 2,
        },
        venueNameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.sm,
        },
        venueNameHero: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.lg,
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        statCard: {
            flexDirection: 'row',
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.03)',
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.sm,
            marginBottom: theme.space.xxs,
            justifyContent: 'space-around',
            alignItems: 'center',
            borderWidth: 1,
            borderColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
        },
        statItem: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
        },
        statValue: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            fontVariant: ['tabular-nums'] as any,
        },
        statLabel: {
            fontSize: 10,
            color: theme.color.textSecondary,
            textTransform: 'uppercase',
            marginTop: 2,
            fontWeight: theme.font.weight.semibold,
            letterSpacing: 0.5,
        },
        statDivider: {
            width: 1,
            height: 20,
            backgroundColor: theme.color.border,
            opacity: 0.5,
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
            borderCurve: 'continuous',
            marginTop: -theme.radius.xl,
            minHeight: Dimensions.get('window').height - HERO_HEIGHT,
            padding: theme.space.sm,
            paddingTop: theme.space.lg,
            flex: 1,
            justifyContent: 'space-between',
        },
        infoSection: {
            marginBottom: theme.space.md,
        },
        mapSection: {
            marginBottom: theme.space.lg,
        },
        sectionTitle: {
            fontSize: theme.font.size.md,
            marginBottom: theme.space.xs,
            color: theme.color.textPrimary,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.xs,
            marginTop: theme.space.xxs,
            marginBottom: theme.space.md,
        },
        tag: {
            paddingHorizontal: theme.space.sm,
            paddingVertical: theme.space.xxs + 2,
            borderRadius: theme.radius.pill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
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
        variationText: {
            fontSize: theme.font.size.xs + 1,
            color: theme.color.textSecondary,
            fontWeight: theme.font.weight.semibold,
            textTransform: 'capitalize',
            letterSpacing: 0.5,
        },
        tagCountText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
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
            paddingVertical: theme.space.md,
            marginVertical: theme.space.md,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
        },
        rateButtonContainerRated: {
            borderWidth: 1,
            borderColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.08)',
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.01)',
            boxShadow:
                theme.mode === 'dark'
                    ? '0px 0px 12px rgba(255,255,255,0.06)'
                    : '0px 0px 12px rgba(0,0,0,0.04)',
        },
        ratingSummaryContainer: {
            marginBottom: theme.space.sm,
        },
        ratingSummaryText: {
            fontSize: theme.font.size.sm + 2,
            color: theme.color.textSecondary,
            lineHeight: theme.font.line.sm + 4,
        },
        ratingSummaryBold: {
            fontSize: theme.font.size.sm + 2,
            color: theme.color.textSecondary,
            lineHeight: theme.font.line.sm + 4,
            fontWeight: theme.font.weight.bold,
            fontStyle: 'italic',
        },
    });
