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
import { ScrollView, StyleSheet, View } from 'react-native';
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

    // Render loading skeleton
    const renderLoadingSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((key) => (
                <ThemedView key={key} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader}>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonPrice} />
                    </View>
                    <View style={styles.skeletonCategory} />
                    <View style={styles.skeletonRating} />
                </ThemedView>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Location Header with Search */}
                <LocationHeader
                    onLocationPress={handleLocationPress}
                    onSearchPress={handleSearchPress}
                />

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Initial Loading State */}
                    {isLoading &&
                        dishes.length === 0 &&
                        renderLoadingSkeleton()}
                    {/* Trending Section */}
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

        // Loading skeleton styles
        skeletonContainer: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.xs,
        },
        skeletonCard: {
            padding: theme.space.md,
            marginBottom: theme.space.sm,
            borderRadius: theme.radius.md,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
        },
        skeletonHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: theme.space.xs,
        },
        skeletonTitle: {
            width: '60%',
            height: 16,
            backgroundColor: theme.color.border,
            borderRadius: theme.radius.xs,
        },
        skeletonPrice: {
            width: '20%',
            height: 16,
            backgroundColor: theme.color.border,
            borderRadius: theme.radius.xs,
        },
        skeletonCategory: {
            width: '40%',
            height: 12,
            backgroundColor: theme.color.border,
            borderRadius: theme.radius.xs,
            marginBottom: theme.space.xs,
        },
        skeletonRating: {
            width: '50%',
            height: 14,
            backgroundColor: theme.color.border,
            borderRadius: theme.radius.xs,
        },
    });
