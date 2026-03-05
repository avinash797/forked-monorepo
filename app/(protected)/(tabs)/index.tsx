import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import HeroCard, { HeroCardSkeleton } from '@/components/Discover/hero-card';
import { RecentBattleTicker } from '@/components/Discover/recent-battle-ticker';
import RisingStarCard, {
    RisingStarCardSkeleton,
} from '@/components/Discover/rising-star-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    DiscoverLocationFilter,
    useDiscoverData,
} from '@/hooks/use-discover-data';
import { trackEvent } from '@/lib/amplitude';
import { useLocationFilterStore, useLocationStore } from '@/stores';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_CITY_NAME = 'New Orleans';

export default function HomeScreen() {
    const router = useRouter();
    const { currentCity, getCurrentMatchedLocation: getCurrentLocation } =
        useLocationStore();
    const { filterType, selectedCityName, nearbyConfig } =
        useLocationFilterStore();

    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheetModal>(null);

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
        const cityName =
            selectedCityName || currentCity?.name || DEFAULT_CITY_NAME;
        return { cityName };
    }, [filterType, selectedCityName, nearbyConfig, currentCity?.name]);

    // Fetch all discover data in a single batch
    const { data: discoverData, isLoading } = useDiscoverData(locationFilter);

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
                <ScrollView showsVerticalScrollIndicator={false}>
                    <LocationHeader
                        onLocationPress={handleLocationPress}
                        onSearchPress={handleSearchPress}
                    />
                    <View style={styles.headerCaptionContainer}>
                        <ThemedText style={styles.headerText}>
                            What are you
                        </ThemedText>
                        <ThemedText style={styles.headerText}>
                            craving?
                        </ThemedText>
                    </View>

                    {/* Hero Section - Popular among Users */}
                    <View style={styles.heroSection}>
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
                                    // Empty state
                                    <View style={styles.emptyState}>
                                        <ThemedText
                                            style={styles.emptyStateText}
                                        >
                                            No popular dishes yet
                                        </ThemedText>
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* Rising Stars Section */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleContainer}>
                                <IconSymbol
                                    name="sparkles-outline"
                                    size={20}
                                    color={theme.color.warning}
                                />
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
                                    // Empty state
                                    <View style={styles.emptyState}>
                                        <ThemedText
                                            style={styles.emptyStateText}
                                        >
                                            No rising stars yet
                                        </ThemedText>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Recent Battle Ticker */}
                    <RecentBattleTicker />
                </ScrollView>
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
            paddingTop: theme.space.xxl,
        },
        container: {
            flex: 1,
        },
        headerText: {
            fontSize: 36,
            fontWeight: theme.font.weight.bold,
            lineHeight: 40,
            fontFamily: "'Instrument Serif', serif",
        },
        headerCaptionContainer: {
            paddingHorizontal: theme.space.md,
        },
        heroSectionWrapper: {
            gap: theme.space.md,
            flex: 1,
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
        emptyState: {
            padding: theme.space.xl,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 200,
        },
        emptyStateText: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.md,
        },
        loadingContainer: {
            padding: theme.space.xl,
            alignItems: 'center',
        },
        expandButton: {
            alignItems: 'center',
            padding: theme.space.md,
        },
        expandText: {
            color: theme.color.textSecondary,
            fontSize: 14,
            fontWeight: '600',
        },
        runnersUpContainer: {
            padding: theme.space.md,
            backgroundColor: theme.color.surface,
            marginHorizontal: theme.space.md,
            borderRadius: theme.radius.md,
        },
    });
