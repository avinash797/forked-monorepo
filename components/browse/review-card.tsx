import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import type { ReviewWithUserProfile } from '@/types/browse';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PhotoGallery } from './photo-gallery';

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
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

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

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    card: {
      padding: theme.space.md,
      marginBottom: theme.space.sm,
      borderRadius: theme.radius.md,
      borderWidth: theme.border.hairline,
      borderColor: theme.color.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.space.sm,
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
      marginRight: theme.space.sm,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.color.info,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.space.sm,
    },
    avatarText: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.semibold,
      color: '#FFFFFF',
    },
    userTextContainer: {
      flex: 1,
    },
    displayName: {
      fontSize: theme.font.size.md,
      marginBottom: theme.space.xxs,
    },
    username: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.pressed - 0.1,
    },
    ratingBadge: {
      paddingHorizontal: theme.space.xs + 2,
      paddingVertical: theme.space.xxs + 2,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.color.info,
    },
    ratingText: {
      fontSize: theme.font.size.md,
      fontWeight: theme.font.weight.bold,
      color: '#FFFFFF',
    },
    reviewText: {
      fontSize: theme.font.size.md,
      lineHeight: theme.font.line.lg,
      marginBottom: theme.space.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.space.xs,
      gap: theme.space.sm,
    },
    date: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.disabled,
    },
    helpfulContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    helpfulText: {
      fontSize: theme.font.size.sm,
      opacity: theme.opacity.pressed - 0.0,
    },
    verifiedBadge: {
      paddingHorizontal: theme.space.xs,
      paddingVertical: theme.space.xxs - 1,
      borderRadius: theme.radius.xs,
      backgroundColor: theme.color.success + '1A',
    },
    verifiedText: {
      fontSize: theme.font.size.xs,
      color: theme.color.success,
      fontWeight: theme.font.weight.semibold,
    },
  });
