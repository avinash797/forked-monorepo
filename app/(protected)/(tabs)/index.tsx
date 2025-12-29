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
import { useTheme } from '@/contexts/theme-provider';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

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

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    searchContainer: {
      paddingHorizontal: theme.space.md,
      paddingTop: theme.space.md,
      paddingBottom: theme.space.xs,
    },
    listContent: {
      paddingHorizontal: theme.space.md,
      paddingBottom: theme.space.lg + theme.space.xs,
    },
    footer: {
      paddingVertical: theme.space.md,
      alignItems: 'center',
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
