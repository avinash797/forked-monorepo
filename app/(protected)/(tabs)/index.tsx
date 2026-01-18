import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import DishTypePills from '@/components/Discover/dish-type-pills';
import HeroCard from '@/components/Discover/hero-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useTopDish } from '@/hooks/use-leaderboard';
import { trackEvent } from '@/lib/amplitude';
import { useLocationStore } from '@/stores/location.store';
import { DishType } from '@/types/dishTypes';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_NOLA_ID = '2865c3db-1a51-464d-bd8e-1a49777a866f';

export default function HomeScreen() {
    const router = useRouter();
    const { currentCity, currentNeighborhood, getCurrentLocation } =
        useLocationStore();

    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [selectedDishType, setSelectedDishType] = useState<DishType | null>(
        null
    );
    const [showTop3, setShowTop3] = useState(false);

    // Get top dish for selected type
    // Use current city or fallback to NOLA
    const cityId = currentCity?.id || DEFAULT_NOLA_ID;

    // Pass neighborhood ID ensuring it aligns with the expected type (string | undefined)
    const neighborhoodId = currentNeighborhood?.id ?? undefined;

    const { data: topDish, isLoading: topDishLoading } = useTopDish(
        cityId,
        selectedDishType?.id || ''
    );

    // Get location on mount
    useEffect(() => {
        getCurrentLocation();
        trackEvent('screen_view', { screen: 'home' });
    }, []);

    const handleDishTypeSelect = (dishType: DishType) => {
        setSelectedDishType(dishType);
        trackEvent('dish_type_selected', {
            dish_type_id: dishType.id,
            screen: 'home',
        });
    };

    // Navigate to search screen
    const handleSearchPress = () => {
        router.push('/(protected)/(browse)/search');
    };

    // Open location filter bottom sheet
    const handleLocationPress = () => {
        bottomSheetRef.current?.snapToIndex(0);
    };

    // Close location filter bottom sheet
    const handleCloseBottomSheet = () => {
        bottomSheetRef.current?.close();
    };

    const handleHeroPress = () => {
        if (topDish?.restaurant_id && selectedDishType?.id) {
            // Navigate to dish detail
            router.push({
                pathname: '/(protected)/(browse)/dish-detail',
                params: {
                    restaurantId: topDish.restaurant_id,
                    dishTypeId: selectedDishType.id,
                },
            });
            trackEvent('hero_card_pressed', {
                restaurant_id: topDish.restaurant_id,
                dish_type_id: selectedDishType.id,
            });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Location Header with Search */}
                <LocationHeader
                    onLocationPress={handleLocationPress}
                    onSearchPress={handleSearchPress}
                />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <DishTypePills
                        selectedDishType={selectedDishType}
                        handleDishTypeSelect={handleDishTypeSelect}
                    />

                    {/* Hero Card Section */}
                    <View style={styles.heroSection}>
                        {topDish ? (
                            <HeroCard
                                dishName={selectedDishType?.name || 'Dish'}
                                restaurantName={topDish.restaurant_name}
                                neighborhood={topDish.neighborhood_name} // From RPC
                                score={topDish.avg_raw_score}
                                onPress={handleHeroPress}
                                // photoPath={topDish.photo_path} // TODO: Add to RPC
                            />
                        ) : // Simple placeholder or loading state could go here
                        topDishLoading ? (
                            <View style={styles.loadingContainer}>
                                <ThemedText>Loading best dish...</ThemedText>
                            </View>
                        ) : null}

                        {/* Expandable Top 3 Stub */}
                        {topDish && (
                            <TouchableOpacity
                                style={styles.expandButton}
                                onPress={() => setShowTop3(!showTop3)}
                            >
                                <ThemedText style={styles.expandText}>
                                    {showTop3
                                        ? 'Hide Runners Up'
                                        : 'Show #2 and #3'}
                                </ThemedText>
                            </TouchableOpacity>
                        )}

                        {showTop3 && (
                            <View style={styles.runnersUpContainer}>
                                <ThemedText
                                    style={{
                                        textAlign: 'center',
                                        opacity: 0.5,
                                    }}
                                >
                                    Runners up coming soon...
                                </ThemedText>
                            </View>
                        )}
                    </View>
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
        },
        container: {
            flex: 1,
        },
        heroSection: {
            marginTop: theme.space.md,
            paddingBottom: 100, // Space for bottom tab
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
