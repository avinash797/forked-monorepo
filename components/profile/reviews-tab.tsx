import { useTheme } from '@/contexts/theme-provider';
import { useUserReviews } from '@/hooks/use-reviews';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Image,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { ScoreBadge } from '../score-badge';
import { ThemedText } from '../themed-text';

interface ReviewsTabProps {
    userId?: string;
}

export function ReviewsTab({ userId }: ReviewsTabProps) {
    const { theme } = useTheme();
    const { data: reviews, isLoading } = useUserReviews(userId);
    const { width } = useWindowDimensions();
    const styles = createThemedStyles(theme);

    // Calculate grid item size (3 columns with small gaps)
    const gap = 5;
    const itemSize = (width - gap * 2 - theme.space.xs) / 2;

    if (isLoading) {
        return (
            <View style={styles.emptyContainer}>
                <ThemedText>Loading reviews...</ThemedText>
            </View>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ThemedText>No reviews yet.</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {reviews.map((review: any) => {
                const photoUrl = review.photo_urls?.[0];
                if (!photoUrl) return null;

                return (
                    <View
                        key={review.id}
                        style={[
                            styles.item,
                            { width: itemSize, height: itemSize * 1.4 },
                        ]}
                    >
                        <Image
                            source={{ uri: photoUrl }}
                            style={styles.image}
                        />
                        <LinearGradient
                            colors={['transparent', theme.color.overlay]}
                            style={styles.overlay}
                        >
                            <View style={styles.ratingContainer}>
                                <ScoreBadge score={review.rating} />
                            </View>
                            <View>
                                <Text style={styles.dishName} numberOfLines={1}>
                                    {review.dishes?.name}
                                </Text>
                                <Text style={styles.location} numberOfLines={1}>
                                    @{review.venues?.name}
                                </Text>
                                <Text
                                    style={styles.reviewText}
                                    numberOfLines={2}
                                >
                                    {review.review_text}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                );
            })}
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            paddingHorizontal: theme.space.xxs,
        },
        emptyContainer: {
            padding: theme.space.xl,
            alignItems: 'center',
        },
        item: {
            position: 'relative',
            marginBottom: theme.space.xs,
            borderRadius: theme.radius.sm,
            overflow: 'hidden',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'space-between',
            padding: theme.space.xs,
            gap: theme.space.xs,
        },
        ratingContainer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        dishName: {
            color: theme.color.textOnImage,
            fontWeight: theme.font.weight.bold,
            fontSize: theme.font.size.md,
        },
        location: {
            color: theme.color.textOnImage,
            fontWeight: theme.font.weight.semibold,
            fontSize: theme.font.size.sm,
        },
        reviewText: {
            color: theme.color.textOnImage,
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.regular,
            marginTop: theme.space.xxs,
        },
    });
