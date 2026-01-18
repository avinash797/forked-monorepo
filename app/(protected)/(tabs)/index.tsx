import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useDishTypes } from '@/hooks/use-dish-types';
import { useTopDish } from '@/hooks/use-leaderboard';
import { trackEvent } from '@/lib/amplitude';
import { useLocationStore } from '@/stores/location.store';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();
    const { currentCity, currentNeighborhood, getCurrentLocation } =
        useLocationStore();
    const { data: dishTypes, isLoading: dishTypesLoading } = useDishTypes();

    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [selectedDishType, setSelectedDishType] = useState<string | null>(
        null
    );

    // Set default dish type when loaded
    useEffect(() => {
        if (dishTypes?.length && !selectedDishType) {
            setSelectedDishType(dishTypes[0].id);
        }
    }, [dishTypes]);

    // Get top dish for selected type
    const { data: topDish, isLoading: topDishLoading } = useTopDish(
        currentCity?.id || '',
        selectedDishType || ''
    );

    // Get location on mount
    useEffect(() => {
        getCurrentLocation();
        trackEvent('screen_view', { screen: 'home' });
    }, []);

    const handleDishTypeSelect = (dishTypeId: string) => {
        setSelectedDishType(dishTypeId);
        trackEvent('dish_type_selected', {
            dish_type_id: dishTypeId,
            screen: 'home',
        });
    };

    const selectedDishTypeName =
        dishTypes?.find((d) => d.id === selectedDishType)?.name || '';

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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Location Header with Search */}
                <LocationHeader
                    onLocationPress={handleLocationPress}
                    onSearchPress={handleSearchPress}
                />

                <ScrollView showsVerticalScrollIndicator={false}></ScrollView>
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
        },
        container: {
            flex: 1,
        },
    });
