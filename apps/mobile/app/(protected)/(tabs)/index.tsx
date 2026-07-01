import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import HeroCard, {
    HeroCardEmpty,
    HeroCardSkeleton,
} from '@/components/Discover/hero-card';
import { RecentBattleTicker } from '@/components/Discover/recent-battle-ticker';
import RisingStarCard, {
    RisingStarCardEmpty,
    RisingStarCardSkeleton,
} from '@/components/Discover/rising-star-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import {
    DiscoverLocationFilter,
    useDiscoverData,
} from '@/hooks/use-discover-data';
import { trackEvent } from '@/lib/amplitude';
import { useLocationFilterStore, useLocationStore } from '@/stores';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();
    const { currentCity, getCurrentMatchedLocation: getCurrentLocation } =
        useLocationStore();
    const { filterType, selectedCityId, nearbyConfig } =
        useLocationFilterStore();

    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 10],
        outputRange: [0, 0.1],
        extrapolate: 'clamp',
    });
    const headerElevation = scrollY.interpolate({
        inputRange: [0, 10],
        outputRange: [0, 4],
        extrapolate: 'clamp',
    });

    // Build location filter based on current filter state
    const locationFilter: DiscoverLocationFilter = useMemo(() => {
        if (filterType === 'nearby' && nearbyConfig) {
            return {
                nearby: {
                    latitude: nearbyConfig.latitude,
                    longitude: nearbyConfig.longitude,
                    radiusMeters: nearbyConfig.radiusMeters,
                },
            };
        }

        // City filter or fallback
        const cityId = selectedCityId || currentCity?.id;
        return { cityId };
    }, [filterType, selectedCityId, nearbyConfig, currentCity?.id]);

    // Fetch all discover data in a single batch
    const {
        data: discoverData,
        isLoading,
        refetch,
    } = useDiscoverData(locationFilter);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    // Filter dish types that have hero data
    const dishTypesWithHeroes =
        discoverData?.dishTypes.filter((dt) => dt.topDish !== null) || [];

    // Filter dish types that have rising star data
    const dishTypesWithRisingStars =
        discoverData?.dishTypes.filter((dt) => dt.risingStar !== null) || [];

    // Get location on mount
    useEffect(() => {
        getCurrentLocation();
        trackEvent('screen_view', { screen: 'home' });
    }, []);

    // Navigate to search screen
    const handleSearchPress = () => {
        router.push('/(protected)/(browse)/search');
    };

    // Open location filter bottom sheet
    const handleLocationPress = () => {
        bottomSheetRef.current?.present();
    };

    // Close location filter bottom sheet
    const handleCloseBottomSheet = () => {
        bottomSheetRef.current?.dismiss();
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Sticky header with scroll-driven shadow */}
                <Animated.View
                    style={[
                        styles.stickyHeader,
                        {
                            shadowOpacity: headerShadowOpacity,
                            elevation: headerElevation,
                        },
                    ]}
                >
                    <LocationHeader
                        onLocationPress={handleLocationPress}
                        onSearchPress={handleSearchPress}
                    />
                </Animated.View>

                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.color.accent}
                        />
                    }
                >
                    <View style={styles.heroSection}>
                        <RecentBattleTicker />

                        <View style={styles.sectionContainer}>
                            <ThemedText
                                type="subtitle"
                                style={styles.sectionTitle}
                            >
                                Popular among Users
                            </ThemedText>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.heroSectionWrapper}
                            >
                                {isLoading ? (
                                    // Show skeletons during loading
                                    <>
                                        <HeroCardSkeleton />
                                        <HeroCardSkeleton />
                                    </>
                                ) : dishTypesWithHeroes.length > 0 ? (
                                    // Render hero cards for dish types with data
                                    dishTypesWithHeroes.map(
                                        (dishType, index) => (
                                            <HeroCard
                                                key={`${dishType.id}-hero`}
                                                dishTypeId={dishType.id}
                                                dish={dishType.topDish!}
                                                index={index}
                                            />
                                        )
                                    )
                                ) : (
                                    // Empty state card
                                    <HeroCardEmpty />
                                )}
                            </ScrollView>
                        </View>

                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleContainer}>
                                <ThemedText type="subtitle">
                                    Rising Stars
                                </ThemedText>
                                <ThemedText
                                    type="default"
                                    style={styles.headerSubtext}
                                >
                                    Hidden Gems to Discover
                                </ThemedText>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.heroSectionWrapper}
                            >
                                {isLoading ? (
                                    // Show skeletons during loading
                                    <>
                                        <RisingStarCardSkeleton />
                                        <RisingStarCardSkeleton />
                                    </>
                                ) : dishTypesWithRisingStars.length > 0 ? (
                                    // Render rising star cards for dish types with data
                                    dishTypesWithRisingStars.map(
                                        (dishType, index) => (
                                            <RisingStarCard
                                                key={`${dishType.id}-rising-star`}
                                                dish={dishType.risingStar!}
                                                index={index}
                                            />
                                        )
                                    )
                                ) : (
                                    // Empty state card
                                    <RisingStarCardEmpty />
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Animated.ScrollView>
            </ThemedView>

            {/* Location Filter Bottom Sheet */}
            <LocationBottomSheet
                ref={bottomSheetRef}
                onClose={handleCloseBottomSheet}
            />
        </SafeAreaView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        container: {
            flex: 1,
            overflow: 'hidden',
        },
        stickyHeader: {
            backgroundColor: theme.color.bg,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
        },
        headerText: {
            fontSize: 36,
            fontWeight: theme.font.weight.bold,
            lineHeight: 40,
        },
        headerCaptionContainer: {
            paddingHorizontal: theme.space.md,
        },
        heroSectionWrapper: {
            gap: theme.space.md,
        },
        heroSection: {
            marginTop: theme.space.md,
        },
        sectionContainer: {
            marginBottom: theme.space.md,
        },
        sectionTitleContainer: {
            marginHorizontal: theme.space.md,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.space.xs,
        },
        sectionTitle: {
            marginHorizontal: theme.space.md,
        },
        headerSubtext: {
            fontSize: theme.font.size.sm,
            fontWeight: '400',
            color: theme.color.textSecondary,
        },
        loadingContainer: {
            padding: theme.space.xl,
            alignItems: 'center',
        },
    });
