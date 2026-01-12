import { useTheme } from '@/contexts/theme-provider';
import { useTrendingDishes } from '@/hooks/use-trending-dishes';
import { useLocationFilterStore } from '@/stores';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { DishCardWithRating } from '../browse/dish-card-with-rating';
import { EmptyState } from '../browse/empty-state';
import { SectionHeader } from '../browse/section-header';
import { ThemedView } from '../themed-view';
import { IconSymbol } from '../ui/icon-symbol';

export default function TrendingSection() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const preferredCity = useLocationFilterStore(
        (state) => state.selectedLocation
    );
    // Fetch truly trending dishes (rising ratings, high activity)
    const { dishes, isLoading, error, hasMore, loadMore, refetch } =
        useTrendingDishes({
            limit: 10,
            city: preferredCity || undefined,
            direction: 'new', // Show dishes that are gaining momentum
        });
    // Navigate to dish detail
    const handleDishPress = (dishId: string) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: { dishId },
        });
    };

    // Render error state
    const renderErrorState = () => (
        <EmptyState
            icon="alert-circle-outline"
            title="Unable to load dishes"
            message={error || 'Please check your connection and try again.'}
            actionLabel="Retry"
            onActionPress={() => refetch()}
        />
    );

    // Render empty state
    const renderEmptyState = () => {
        if (isLoading) return renderLoadingSkeleton();
        if (error) return renderErrorState();

        return (
            <EmptyState
                icon="restaurant-outline"
                title="No dishes found"
                message="Be the first to rate a dish and share your experience!"
                actionLabel="Rate a Dish"
                onActionPress={() => router.push('/(protected)/(rating)')}
            />
        );
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
        <>
            {/* Section Header */}
            <SectionHeader
                title="Rising Dishes"
                subtitle="Trending up this week"
                seeAllLabel={
                    <View style={styles.seeAllIcon}>
                        <IconSymbol
                            name="arrow-forward-outline"
                            color={theme.color.textPrimary}
                        />
                    </View>
                }
                onSeeAllPress={() => console.log('See all pressed')}
            />
            {/* Dishes List */}
            {!error && (
                <FlatList
                    data={dishes}
                    keyExtractor={(item) => item.id}
                    horizontal={true}
                    renderItem={({ item }) => (
                        <DishCardWithRating
                            dish={item}
                            onPress={() => handleDishPress(item.id)}
                            showVenue={true}
                            viewMode="horizontal"
                            showTrend={true}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    // Performance optimizations
                    windowSize={5}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    initialNumToRender={10}
                />
            )}
        </>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        listContent: {
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.lg + theme.space.xs,
        },
        seeAllIcon: {
            borderRadius: theme.radius.pill,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            padding: theme.space.xxs,
            backgroundColor: theme.color.surface,
        },
        // Loading skeleton styles
        skeletonContainer: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.xs,
            flexDirection: 'row',
            height: 200,
            width: 400,
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
