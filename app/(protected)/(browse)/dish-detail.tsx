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
import { useTheme } from '@/contexts/theme-provider';

export default function DishDetailScreen() {
  const router = useRouter();
  const { dishId } = useLocalSearchParams<{ dishId: string }>();
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

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
    photoSection: {
      padding: theme.space.md,
    },
    infoSection: {
      paddingHorizontal: theme.space.md,
      paddingBottom: theme.space.lg + theme.space.xs,
    },
    dishName: {
      fontSize: theme.font.size.xxl + 4,
      marginBottom: theme.space.xs,
    },
    venueName: {
      fontSize: theme.font.size.md,
      marginBottom: theme.space.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.space.sm,
    },
    price: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.semibold,
    },
    category: {
      fontSize: theme.font.size.md,
      opacity: theme.opacity.pressed - 0.1,
    },
    separator: {
      fontSize: theme.font.size.md,
      opacity: theme.opacity.disabled - 0.05,
      marginHorizontal: theme.space.xs,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.space.sm,
    },
    rating: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.bold,
      color: theme.color.info,
    },
    reviewCount: {
      fontSize: theme.font.size.md,
      opacity: theme.opacity.pressed - 0.1,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.xs,
      marginBottom: theme.space.md,
    },
    tag: {
      paddingHorizontal: theme.space.sm,
      paddingVertical: theme.space.xxs + 2,
      borderRadius: theme.radius.sm - 2,
      backgroundColor: theme.color.info + '1A',
    },
    tagText: {
      fontSize: theme.font.size.sm,
      color: theme.color.info,
      fontWeight: theme.font.weight.medium,
    },
    description: {
      fontSize: theme.font.size.md,
      lineHeight: theme.font.line.relaxed,
      opacity: theme.opacity.pressed - 0.0,
    },
    reviewsSection: {
      paddingTop: theme.space.xs,
    },
    emptyReviews: {
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.xxl,
    },
    rateButtonContainer: {
      paddingHorizontal: theme.space.md,
      paddingBottom: theme.space.xxl,
    },
  });
