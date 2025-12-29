import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PhotoGallery } from './photo-gallery';
import type { ReviewWithUserProfile } from '@/types/browse';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface ReviewCardProps {
  review: ReviewWithUserProfile;
  onUserPress?: (userId: string) => void;
  onPhotoPress?: (index: number) => void;
}

/**
 * Review card component displaying user info, rating, text, and photos
 * Uses 0-10 numeric rating scale (NOT stars)
 * Used in: Dish detail screen, review lists
 */
export function ReviewCard({
  review,
  onUserPress,
  onPhotoPress,
}: ReviewCardProps) {

  // Format date
  const reviewDate = new Date(review.created_at);
  const formattedDate = reviewDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const displayName = review.profile?.display_name || review.profile?.username || 'Anonymous';
  const username = review.profile?.username;

  return (
    <ThemedView style={styles.card}>
      {/* User Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onUserPress?.(review.user_id)}
          activeOpacity={0.7}
          style={styles.userInfo}
          disabled={!onUserPress}
        >
          {/* Profile Photo */}
          {review.profile?.profile_photo_url ? (
            <Image
              source={{ uri: review.profile.profile_photo_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}

          {/* User Name */}
          <View style={styles.userTextContainer}>
            <ThemedText type="defaultSemiBold" style={styles.displayName}>
              {displayName}
            </ThemedText>
            {username && (
              <ThemedText style={styles.username}>@{username}</ThemedText>
            )}
          </View>
        </TouchableOpacity>

        {/* Rating (0-10 numeric scale) */}
        <View style={styles.ratingBadge}>
          <ThemedText style={styles.ratingText}>{review.rating.toFixed(1)}</ThemedText>
        </View>
      </View>

      {/* Review Text */}
      {review.review_text && (
        <ThemedText style={styles.reviewText}>{review.review_text}</ThemedText>
      )}

      {/* Photos */}
      {review.photo_urls && review.photo_urls.length > 0 && (
        <PhotoGallery
          photos={review.photo_urls}
          onPhotoPress={onPhotoPress}
          maxVisible={6}
        />
      )}

      {/* Footer: Date and Helpful Votes */}
      <View style={styles.footer}>
        <ThemedText style={styles.date}>{formattedDate}</ThemedText>

        {review.helpful_votes_count > 0 && (
          <View style={styles.helpfulContainer}>
            <ThemedText style={styles.helpfulText}>
              👍 Helpful ({review.helpful_votes_count})
            </ThemedText>
          </View>
        )}

        {/* GPS Verified Badge */}
        {review.is_gps_verified && (
          <View style={styles.verifiedBadge}>
            <ThemedText style={styles.verifiedText}>✓ Verified</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userTextContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    opacity: 0.6,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  date: {
    fontSize: 13,
    opacity: 0.5,
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 13,
    opacity: 0.7,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  verifiedText: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
  },
});
