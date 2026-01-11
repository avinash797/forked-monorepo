import { useTheme } from '@/contexts/theme-provider';
import { useTopDishes } from '@/hooks/use-top-dishes';
import { useLocationFilterStore } from '@/stores';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { DishCardWithRating } from '../browse/dish-card-with-rating';
import { EmptyState } from '../browse/empty-state';
import { SectionHeader } from '../browse/section-header';
import { IconSymbol } from '../ui/icon-symbol';

export default function TrendingSection() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const preferredCity = useLocationFilterStore(
        (state) => state.selectedLocation
    );
    // Fetch top dishes with pagination
    const { dishes, isLoading, error, hasMore, loadMore, refetch } =
        useTopDishes({
            limit: 10,
            city: preferredCity || undefined,
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
        if (isLoading) return null;
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
    return (
        <>
            {/* Section Header */}
            <SectionHeader
                title="Trending Dishes Near You"
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
    });
