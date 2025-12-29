import { DishCardWithRating } from '@/components/browse/dish-card-with-rating';
import { EmptyState } from '@/components/browse/empty-state';
import { SectionHeader } from '@/components/browse/section-header';
import { SearchInput } from '@/components/rating/search-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedView } from '@/components/themed-view';
import { useTopDishes } from '@/hooks/use-top-dishes';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch top dishes with pagination
  const { dishes, isLoading, error, hasMore, loadMore, refetch } = useTopDishes({
    limit: 20,
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

  // Navigate to dish detail
  const handleDishPress = (dishId: string) => {
    router.push({
      pathname: '/(protected)/(browse)/dish-detail',
      params: { dishId },
    });
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

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <EmptyState
        icon="restaurant"
        title="No dishes found"
        message="Be the first to rate a dish and share your experience!"
        actionLabel="Rate a Dish"
        onActionPress={() => router.push('/(protected)/(rating)')}
      />
    );
  };

  // Render error state
  const renderErrorState = () => (
    <EmptyState
      icon="error"
      title="Unable to load dishes"
      message={error || 'Please check your connection and try again.'}
      actionLabel="Retry"
      onActionPress={() => refetch()}
    />
  );

  // Render footer (Load More button)
  const renderFooter = () => {
    if (!hasMore || isLoading) return null;

    return (
      <View style={styles.footer}>
        <ThemedButton variant="secondary" onPress={loadMore}>
          Load More Dishes
        </ThemedButton>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchInput
            value=""
            onChangeText={() => { }}
            placeholder="Search dishes and venues..."
            onFocus={handleSearchPress}
            isLoading={false}
          />
        </View>

        {/* Section Header */}
        <SectionHeader title="Top Rated Dishes" subtitle="Discover the best-rated dishes near you" />

        {/* Error State */}
        {error && renderErrorState()}

        {/* Dishes List */}
        {!error && (
          <FlatList
            data={dishes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DishCardWithRating
                dish={item}
                onPress={() => handleDishPress(item.id)}
                showVenue={true}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            windowSize={5}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
          />
        )}

        {/* Initial Loading State */}
        {isLoading && dishes.length === 0 && renderLoadingSkeleton()}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  // Loading skeleton styles
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonPrice: {
    width: '20%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonCategory: {
    width: '40%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonRating: {
    width: '50%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
});
