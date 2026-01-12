import { LocationBottomSheet } from '@/components/browse/location-bottom-sheet';
import { LocationHeader } from '@/components/browse/location-header';
import TrendingSection from '@/components/discover/trending-section';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useTopDishes } from '@/hooks/use-top-dishes';
import { useLocationFilterStore } from '@/stores';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const preferredCity = useLocationFilterStore(
        (state) => state.selectedLocation
    );

    // Fetch top dishes with pagination
    const { dishes, isLoading, error, hasMore, loadMore, refetch } =
        useTopDishes({
            limit: 10,
            city: preferredCity || undefined,
        });

    // Handle pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Location Header with Search */}
                <LocationHeader
                    onLocationPress={handleLocationPress}
                    onSearchPress={handleSearchPress}
                />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <TrendingSection />
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
        },
        container: {
            flex: 1,
        },
    });
