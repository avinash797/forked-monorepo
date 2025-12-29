import { DishCardWithRating } from '@/components/browse/dish-card-with-rating';
import { EmptyState } from '@/components/browse/empty-state';
import { SectionHeader } from '@/components/browse/section-header';
import { SearchInput } from '@/components/rating/search-input';
import { VenueCard } from '@/components/rating/venue-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSearch } from '@/hooks/use-search';
import { useRouter } from 'expo-router';
import { useState, } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-provider';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

  const { results, isLoading, error } = useSearch(query);

  // Group results by type
  const dishResults = results.filter((r) => r.type === 'dish');
  const venueResults = results.filter((r) => r.type === 'venue');

  // Navigate to dish detail
  const handleDishPress = (dishId: string) => {
    router.push({
      pathname: '/(protected)/(browse)/dish-detail',
      params: { dishId },
    });
  };

  // Navigate to venue detail
  const handleVenuePress = (venueId: string) => {
    router.push({
      pathname: '/(protected)/(browse)/venue-detail',
      params: { venueId },
    });
  };

  // Render empty state when no query
  const renderEmptyQuery = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="search"
        title="Search for dishes and venues"
        message="Find your favorite dishes or discover new places to eat"
      />
    </View>
  );

  // Render no results state
  const renderNoResults = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="search"
        title={`No results for "${query}"`}
        message="Try adjusting your search or browse top dishes"
        actionLabel="Browse Dishes"
        onActionPress={() => router.back()}
      />
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="error"
        title="Search failed"
        message={error || 'Please try again'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Custom Header with Back Button and Search */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow-back" size={24} color={theme.color.info} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search dishes and venues..."
              isLoading={isLoading}
              autoFocus={true}
            />
          </View>
        </View>

        {/* Search Results */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error State */}
          {error && renderError()}

          {/* Empty Query State */}
          {!error && query.length === 0 && renderEmptyQuery()}

          {/* No Results State */}
          {!error && query.length >= 2 && !isLoading && results.length === 0 && renderNoResults()}

          {/* Results */}
          {!error && query.length >= 2 && results.length > 0 && (
            <View style={styles.resultsContainer}>
              {/* Dishes Section */}
              {dishResults.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Dishes"
                    subtitle={`${dishResults.length} ${dishResults.length === 1 ? 'result' : 'results'}`}
                  />
                  <View style={styles.sectionContent}>
                    {dishResults.map((result) => (
                      <DishCardWithRating
                        key={result.data.id}
                        dish={result.data}
                        onPress={() => handleDishPress(result.data.id)}
                        showVenue={true}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Venues Section */}
              {venueResults.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Venues"
                    subtitle={`${venueResults.length} ${venueResults.length === 1 ? 'result' : 'results'}`}
                  />
                  <View style={styles.sectionContent}>
                    {venueResults.map((result) => (
                      <VenueCard
                        key={result.data.id}
                        venue={result.data}
                        onPress={() => handleVenuePress(result.data.id)}
                        showDistance={false}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Loading indicator for query < 2 chars */}
          {query.length > 0 && query.length < 2 && (
            <View style={styles.hintContainer}>
              <ThemedText style={styles.hintText}>
                Type at least 2 characters to search
              </ThemedText>
            </View>
          )}
        </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.sm,
      borderBottomWidth: theme.border.hairline,
      borderBottomColor: theme.color.border,
    },
    backButton: {
      marginRight: theme.space.sm,
      padding: theme.space.xxs,
    },
    searchInputContainer: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    resultsContainer: {
      paddingTop: theme.space.xs,
    },
    section: {
      marginBottom: theme.space.lg + theme.space.xs,
    },
    sectionContent: {
      paddingHorizontal: theme.space.md,
    },
    emptyContainer: {
      flex: 1,
      paddingTop: 120,
      paddingHorizontal: theme.space.md,
    },
    hintContainer: {
      paddingHorizontal: theme.space.md,
      paddingTop: theme.space.xxl,
      alignItems: 'center',
    },
    hintText: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.pressed - 0.1,
      textAlign: 'center',
    },
  });
