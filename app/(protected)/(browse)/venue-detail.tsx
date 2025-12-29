import { DishCardWithRating } from '@/components/browse/dish-card-with-rating';
import { EmptyState } from '@/components/browse/empty-state';
import { SectionHeader } from '@/components/browse/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/hooks/use-location';
import { useVenueDetail } from '@/hooks/use-venue-detail';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-provider';

export default function VenueDetailScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

  const { venue, dishes, reviewPhotos, isLoading, error } = useVenueDetail(venueId);
  const { location } = useLocation();

  // Calculate distance to venue
  const getDistance = () => {
    if (!venue?.latitude || !venue?.longitude || !location) return null;

    const R = 6371e3; // Earth radius in meters
    const φ1 = (location.latitude * Math.PI) / 180;
    const φ2 = (venue.latitude * Math.PI) / 180;
    const Δφ = ((venue.latitude - location.latitude) * Math.PI) / 180;
    const Δλ = ((venue.longitude - location.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const distance = getDistance();

  // Format distance
  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Navigate to dish detail
  const handleDishPress = (dishId: string) => {
    router.push({
      pathname: '/(protected)/(browse)/dish-detail',
      params: { dishId },
    });
  };

  // Navigate to rating flow
  const handleAddDishPress = () => {
    router.push('/(protected)/(rating)');
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading venue details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !venue) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.container}>
          <EmptyState
            icon="error"
            title="Unable to load venue"
            message={error || 'This venue may no longer be available.'}
            actionLabel="Go Back"
            onActionPress={() => router.back()}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ title: venue.name }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Venue Header */}
        <View style={styles.headerSection}>
          {/* Venue Name */}
          {/* Review Photos Carousel */}
          {reviewPhotos.length > 0 && (
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                decelerationRate="fast"
                snapToInterval={292} // width + gap
              >
                {reviewPhotos.map((photoUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: photoUrl }}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cuisine Tags */}
          {venue.cuisine_types && venue.cuisine_types.length > 0 && (
            <View style={styles.cuisinesContainer}>
              {venue.cuisine_types.map((cuisine, index) => (
                <View key={index} style={styles.cuisineTag}>
                  <ThemedText style={styles.cuisineText}>{cuisine}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Price Range and Distance */}
          <View style={styles.metaRow}>
            {venue.price_range && (
              <ThemedText style={styles.priceRange}>
                {'$'.repeat(venue.price_range)}
              </ThemedText>
            )}
            {venue.price_range && distance && (
              <ThemedText style={styles.separator}>•</ThemedText>
            )}
            {distance && (
              <ThemedText style={styles.distance}>
                {formatDistance(distance)}
              </ThemedText>
            )}
          </View>

          {/* Address */}
          <View style={styles.addressContainer}>
            <ThemedText style={styles.address}>
              {venue.address_street}
            </ThemedText>
            <ThemedText style={styles.address}>
              {venue.address_city}, {venue.address_state} {venue.address_zip}
            </ThemedText>
          </View>
        </View>

        {/* Dishes Section */}
        <View style={styles.dishesSection}>
          <SectionHeader
            title={`Menu (${dishes.length})`}
            subtitle={dishes.length === 0 ? 'No dishes rated yet' : undefined}
          />

          {/* Empty state for dishes */}
          {dishes.length === 0 && (
            <View style={styles.emptyDishes}>
              <EmptyState
                icon="restaurant"
                title="No dishes rated yet"
                message="Be the first to rate a dish at this venue!"
                actionLabel="Add a Dish"
                onActionPress={handleAddDishPress}
              />
            </View>
          )}

          {/* Dish Cards */}
          <View style={styles.dishesList}>
            {dishes.map((dish) => (
              <DishCardWithRating
                key={dish.id}
                dish={dish}
                onPress={() => handleDishPress(dish.id)}
                showVenue={false}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: theme.space.md,
      opacity: theme.opacity.pressed - 0.1,
    },
    headerSection: {
      padding: theme.space.md,
      borderBottomWidth: theme.border.hairline,
      borderBottomColor: theme.color.border,
    },
    venueName: {
      fontSize: theme.font.size.xxl + 4,
      marginBottom: theme.space.sm,
    },
    cuisinesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.xs,
      marginBottom: theme.space.sm,
    },
    cuisineTag: {
      paddingHorizontal: theme.space.sm,
      paddingVertical: theme.space.xxs + 2,
      borderRadius: theme.radius.sm - 2,
      backgroundColor: theme.color.success + '1A',
    },
    cuisineText: {
      fontSize: theme.font.size.sm,
      color: theme.color.success,
      fontWeight: theme.font.weight.medium,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.space.sm,
    },
    priceRange: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.semibold,
      color: theme.color.success,
    },
    distance: {
      fontSize: theme.font.size.md,
      opacity: theme.opacity.pressed - 0.1,
    },
    separator: {
      fontSize: theme.font.size.md,
      opacity: theme.opacity.disabled - 0.05,
      marginHorizontal: theme.space.xs,
    },
    addressContainer: {
      marginTop: theme.space.xxs,
    },
    address: {
      fontSize: theme.font.size.md,
      lineHeight: theme.font.line.relaxed,
      opacity: theme.opacity.pressed - 0.1,
    },
    dishesSection: {
      paddingTop: theme.space.xs,
    },
    emptyDishes: {
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.xxl,
    },
    dishesList: {
      paddingHorizontal: theme.space.md,
      paddingBottom: theme.space.lg + theme.space.xs,
    },
    carouselContainer: {
      marginBottom: theme.space.lg + theme.space.xs,
      marginHorizontal: -theme.space.md,
    },
    carouselContent: {
      paddingHorizontal: theme.space.md,
      gap: theme.space.sm,
    },
    carouselImage: {
      width: 300,
      height: 200,
      borderRadius: theme.radius.xs,
      backgroundColor: theme.color.border + '66',
    },
  });
