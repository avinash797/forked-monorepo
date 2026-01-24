import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import HeroCard from '@/components/Discover/hero-card';
import { RecentBattleTicker } from '@/components/Discover/recent-battle-ticker';
import RisingStarCard from '@/components/Discover/rising-star-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useDishTypes } from '@/hooks/use-dish-types';
import { trackEvent } from '@/lib/amplitude';
import { useLocationStore } from '@/stores/location.store';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_NOLA_ID = '2865c3db-1a51-464d-bd8e-1a49777a866f';

export default function HomeScreen() {
    const router = useRouter();
    const { currentCity, getCurrentLocation } = useLocationStore();
    const { data: dishTypes, isLoading: dishTypesLoading } = useDishTypes();

    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Get top dish for selected type
    // Use current city or fallback to NOLA
    const cityId = currentCity?.id || DEFAULT_NOLA_ID;

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
                {/* Location Header with Search */}

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

                    {dishTypes && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.heroSectionWrapper}
                        >
                            {dishTypes?.map((dishType) => (
                                <View
                                    style={styles.heroSection}
                                    key={`${dishType.id}-${cityId}-hero-carousel`}
                                >
                                    {/* Rising Star Card */}
                                    <HeroCard
                                        cityId={cityId}
                                        dishTypeId={dishType.id}
                                    />
                                    {/* Rising Star Card */}
                                    <RisingStarCard
                                        cityId={cityId}
                                        dishTypeId={dishType.id}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Recent Battle Ticker */}
                    <RecentBattleTicker cityId={cityId} />
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
