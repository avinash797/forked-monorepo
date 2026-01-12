import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import type { ReviewWithUserProfile } from '@/types/browse';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { PhotoGallery } from './photo-gallery';

interface ReviewCardProps {
    review: ReviewWithUserProfile;
    onUserPress?: (userId: string) => void;
    onPhotoPress?: (index: number) => void;
}

/**
 * Enhanced review card component matching the premium design language
 * Uses themed tokens, ScoreBadge, and consistent iconography
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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const displayName =
        review.profile?.display_name || review.profile?.username || 'Anonymous';
    const username = review.profile?.username;

    return (
        <ThemedView style={styles.card}>
            {/* User Info & Rating Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => onUserPress?.(review.user_id)}
                    style={({ pressed }) => [
                        styles.userInfo,
                        pressed && { opacity: 0.7 },
                    ]}
                    disabled={!onUserPress}
                    android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
                >
                    {/* Profile Photo */}
                    {review.profile?.avatar_url ? (
                        <Image
                            source={{
                                uri: review.profile?.avatar_url ?? undefined,
                            }}
                            style={styles.avatar}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <ThemedText style={styles.avatarText}>
                                {displayName.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                    )}

                    <View style={styles.userTextContainer}>
                        <ThemedText
                            style={styles.displayName}
                            numberOfLines={1}
                        >
                            {displayName}
                        </ThemedText>
                        <ThemedText style={styles.date} numberOfLines={1}>
                            {formattedDate}
                        </ThemedText>
                    </View>
                </Pressable>

                {/* Numeric Rating using ScoreBadge */}
                <ScoreBadge score={review.rating} style={styles.ratingBadge} />
            </View>

            {/* Review Text */}
            {review.review_text && (
                <ThemedText style={styles.reviewText}>
                    {review.review_text}
                </ThemedText>
            )}

            {/* Photos Carousel/Gallery */}
            {review.photo_urls && review.photo_urls.length > 0 && (
                <View style={styles.photoGalleryContainer}>
                    <PhotoGallery
                        photos={review.photo_urls}
                        onPhotoPress={onPhotoPress}
                        maxVisible={6}
                    />
                </View>
            )}

            {/* Footer: Helpful and Verified */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    {review.helpful_votes_count > 0 && (
                        <View style={styles.helpfulBadge}>
                            <IconSymbol
                                name="thumbs-up-outline"
                                size={14}
                                color={theme.color.textSecondary}
                            />
                            <ThemedText style={styles.helpfulText}>
                                {review.helpful_votes_count}
                            </ThemedText>
                        </View>
                    )}

                    {review.is_gps_verified && (
                        <View style={styles.verifiedBadge}>
                            <IconSymbol
                                name="checkmark-done"
                                size={14}
                                color={theme.color.success}
                            />
                            <ThemedText style={styles.verifiedText}>
                                Verified
                            </ThemedText>
                        </View>
                    )}
                </View>

                {username && (
                    <ThemedText style={styles.username} numberOfLines={1}>
                        @{username}
                    </ThemedText>
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
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: theme.color.border + '1A',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.md,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: theme.space.sm,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            marginRight: theme.space.sm,
            backgroundColor: theme.color.surface2,
        },
        avatarPlaceholder: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.color.info + '22',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.space.sm,
        },
        avatarText: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.info,
        },
        userTextContainer: {
            flex: 1,
        },
        displayName: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        date: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            marginTop: 2,
        },
        ratingBadge: {
            shadowOpacity: 0, // ScoreBadge already has shadows, but we can override if needed
            elevation: 0,
        },
        reviewText: {
            fontSize: theme.font.size.md,
            lineHeight: theme.font.line.md,
            color: theme.color.textSecondary,
            marginBottom: theme.space.md,
        },
        photoGalleryContainer: {
            marginBottom: theme.space.sm,
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.space.xs,
        },
        footerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
        },
        helpfulBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.03)',
            paddingHorizontal: theme.space.xs,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
        },
        helpfulText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            fontWeight: theme.font.weight.medium,
        },
        verifiedBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: theme.space.xs,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
        },
        verifiedText: {
            fontSize: theme.font.size.xs,
            color: theme.color.success,
            fontWeight: theme.font.weight.semibold,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        username: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            fontStyle: 'italic',
        },
    });
