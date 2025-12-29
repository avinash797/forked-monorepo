import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { DishWithVenue } from '@/types/browse';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/theme-provider';

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
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

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

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    card: {
      marginBottom: theme.space.sm,
      borderRadius: theme.radius.md,
      borderWidth: theme.border.hairline,
      borderColor: theme.color.border,
      overflow: 'hidden',
    },
    cardContent: {
      padding: theme.space.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.space.xxs + 2,
    },
    name: {
      flex: 1,
      fontSize: theme.font.size.md,
      marginRight: theme.space.xs,
    },
    price: {
      fontSize: theme.font.size.md,
      fontWeight: theme.font.weight.semibold,
    },
    category: {
      fontSize: theme.font.size.xs + 1,
      opacity: theme.opacity.pressed - 0.1,
      marginBottom: theme.space.xs,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.space.xs,
    },
    rating: {
      fontSize: theme.font.size.md,
      fontWeight: theme.font.weight.bold,
      color: theme.color.info,
    },
    separator: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.disabled - 0.05,
      marginHorizontal: theme.space.xxs + 2,
    },
    reviewCount: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.pressed - 0.2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.xxs + 2,
    },
    tag: {
      paddingHorizontal: theme.space.xs,
      paddingVertical: theme.space.xxs,
      borderRadius: theme.radius.xs - 2,
      backgroundColor: theme.color.info + '1A',
    },
    tagText: {
      fontSize: theme.font.size.xs - 1,
      color: theme.color.info,
      fontWeight: theme.font.weight.medium,
    },
    venueName: {
      fontSize: theme.font.size.xs + 1,
      opacity: theme.opacity.pressed - 0.1,
      marginTop: theme.space.xs,
      fontStyle: 'italic',
    },
  });
