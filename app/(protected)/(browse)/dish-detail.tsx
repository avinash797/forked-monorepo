import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';
import { ReviewCard } from '@/components/browse/review-card';
import { PhotoGallery } from '@/components/browse/photo-gallery';
import { SectionHeader } from '@/components/browse/section-header';
import { EmptyState } from '@/components/browse/empty-state';
import { useDishDetail } from '@/hooks/use-dish-detail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DishDetailScreen() {
  const router = useRouter();
  const { dishId } = useLocalSearchParams<{ dishId: string }>();

  const { dish, reviews, isLoading, error } = useDishDetail(dishId);

  // Navigate to venue detail
  const handleVenuePress = () => {
    if (dish?.venue?.id) {
      router.push({
        pathname: '/(protected)/(browse)/venue-detail',
        params: { venueId: dish.venue.id },
      });
    }
  };

  // Navigate to rating flow
  const handleRateDishPress = () => {
    router.push('/(protected)/(rating)');
  };

  // Collect all photos from reviews
  const allPhotos = reviews.flatMap((review) => review.photo_urls || []);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading dish details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !dish) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.container}>
          <EmptyState
            icon="error"
            title="Unable to load dish"
            message={error || 'This dish may no longer be available.'}
            actionLabel="Go Back"
            onActionPress={() => router.back()}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        {allPhotos.length > 0 && (
          <View style={styles.photoSection}>
            <PhotoGallery photos={allPhotos} maxVisible={6} />
          </View>
        )}

        {/* Dish Info */}
        <View style={styles.infoSection}>
          {/* Dish Name */}
          <ThemedText type="title" style={styles.dishName}>
            {dish.name}
          </ThemedText>

          {/* Venue Name (tappable) */}
          {dish.venue && (
            <TouchableOpacity onPress={handleVenuePress} activeOpacity={0.7}>
              <ThemedText type="link" style={styles.venueName}>
                at {dish.venue.name} →
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Price and Category */}
          <View style={styles.metaRow}>
            {dish.current_price && (
              <ThemedText style={styles.price}>
                ${dish.current_price.toFixed(2)}
              </ThemedText>
            )}
            {dish.current_price && dish.category && (
              <ThemedText style={styles.separator}>•</ThemedText>
            )}
            <ThemedText style={styles.category}>{dish.category}</ThemedText>
          </View>

          {/* Rating and Review Count */}
          {dish.average_rating !== null && dish.review_count > 0 && (
            <View style={styles.ratingRow}>
              <ThemedText style={styles.rating}>
                {dish.average_rating.toFixed(1)}/10
              </ThemedText>
              <ThemedText style={styles.separator}>•</ThemedText>
              <ThemedText style={styles.reviewCount}>
                {dish.review_count} {dish.review_count === 1 ? 'review' : 'reviews'}
              </ThemedText>
            </View>
          )}

          {/* Dietary Tags */}
          {dish.dietary_tags && dish.dietary_tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {dish.dietary_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {dish.description && (
            <ThemedText style={styles.description}>{dish.description}</ThemedText>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <SectionHeader
            title={`Reviews (${reviews.length})`}
            subtitle={reviews.length === 0 ? 'Be the first to review!' : undefined}
          />

          {/* Empty state for reviews */}
          {reviews.length === 0 && (
            <View style={styles.emptyReviews}>
              <EmptyState
                icon="restaurant"
                title="No reviews yet"
                message="Be the first to share your experience with this dish!"
                actionLabel="Rate This Dish"
                onActionPress={handleRateDishPress}
              />
            </View>
          )}

          {/* Review Cards */}
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>

        {/* Rate This Dish Button (if reviews exist) */}
        {reviews.length > 0 && (
          <View style={styles.rateButtonContainer}>
            <ThemedButton onPress={handleRateDishPress}>
              Rate This Dish
            </ThemedButton>
          </View>
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.6,
  },
  photoSection: {
    padding: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dishName: {
    fontSize: 28,
    marginBottom: 8,
  },
  venueName: {
    fontSize: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
  },
  category: {
    fontSize: 16,
    opacity: 0.7,
  },
  separator: {
    fontSize: 16,
    opacity: 0.4,
    marginHorizontal: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  reviewCount: {
    fontSize: 16,
    opacity: 0.6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  reviewsSection: {
    paddingTop: 8,
  },
  emptyReviews: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  rateButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
