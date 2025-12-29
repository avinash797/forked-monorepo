import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { DishWithVenue } from '@/types/browse';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface DishCardWithRatingProps {
  dish: DishWithVenue;
  onPress: () => void;
  showVenue?: boolean;
}

/**
 * Enhanced dish card component that displays rating and review count
 * Based on the existing DishCard pattern but adds rating display
 * Uses 0-10 numeric rating scale (NOT stars)
 * Used in: Home feed, search results, venue detail
 */
export function DishCardWithRating({
  dish,
  onPress,
  showVenue = false,
}: DishCardWithRatingProps) {

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      <ThemedView style={styles.cardContent}>
        {/* Header: Name and Price */}
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {dish.name}
          </ThemedText>
          {dish.current_price && (
            <ThemedText style={styles.price}>
              ${dish.current_price.toFixed(2)}
            </ThemedText>
          )}
        </View>

        {/* Category */}
        <ThemedText style={styles.category}>{dish.category}</ThemedText>

        {/* Rating and Review Count (0-10 numeric scale) */}
        {dish.average_rating !== null && dish.review_count > 0 && (
          <View style={styles.ratingContainer}>
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

        {/* Venue Name (optional) */}
        {showVenue && dish.venue && (
          <ThemedText style={styles.venueName}>
            at {dish.venue.name}
          </ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  separator: {
    fontSize: 14,
    opacity: 0.4,
    marginHorizontal: 6,
  },
  reviewCount: {
    fontSize: 14,
    opacity: 0.6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  venueName: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
