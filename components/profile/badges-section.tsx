import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useUserBadges } from '@/hooks/use-badges';
import type { UserBadgeWithDefinition } from '@/types/badge.types';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { BounceIn, FadeInDown } from 'react-native-reanimated';

interface BadgesSectionProps {
    userId?: string;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
    const { theme } = useTheme();
    const { data: badges, isLoading } = useUserBadges(userId);
    const styles = createThemedStyles(theme);
    const [selectedBadge, setSelectedBadge] = useState<UserBadgeWithDefinition | null>(null);

    const allBadges = badges?.filter((b) => b.is_active) ?? [];
    const earnedCount = allBadges.filter((b) => b.earned_at !== null).length;

    if (isLoading) {
        return (
            <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.container}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Badges</ThemedText>
                </View>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.emptyText}>Loading...</ThemedText>
                </View>
            </Animated.View>
        );
    }

    if (allBadges.length === 0) {
        return (
            <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.container}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Badges</ThemedText>
                </View>
                <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                        No badges available yet!
                    </ThemedText>
                </View>
            </Animated.View>
        );
    }

    const renderBadge = ({
        item,
        index,
    }: {
        item: UserBadgeWithDefinition;
        index: number;
    }) => {
        const isEarned = item.earned_at !== null;
        return (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).duration(300)} style={styles.badgeWrapper}>
                <Pressable
                    style={({ pressed }) => [
                        styles.badgeItem,
                        pressed && styles.badgeItemPressed,
                    ]}
                    onPress={() => setSelectedBadge(item)}
                >
                    <ThemedView
                        style={[
                            styles.badgeImageContainer,
                            item.is_featured && isEarned && styles.badgeImageFeatured,
                            !isEarned && styles.badgeImageUnearned,
                        ]}
                    >
                        {item.image_url ? (
                            <Image
                                source={{ uri: item.image_url }}
                                style={[
                                    styles.badgeImage,
                                    !isEarned && styles.unearnedImage,
                                ]}
                                contentFit="contain"
                            />
                        ) : (
                            <ThemedText style={[styles.placeholderEmoji, !isEarned && styles.unearnedImage]}>
                                🏅
                            </ThemedText>
                        )}
                    </ThemedView>
                    <ThemedText style={[styles.badgeName, !isEarned && styles.unearnedText]} numberOfLines={1}>
                        {item.name}
                    </ThemedText>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.container}
        >
            <View style={styles.header}>
                <ThemedText style={styles.title}>Badges</ThemedText>
                <ThemedText style={styles.badgeCount}>
                    {earnedCount} of {allBadges.length} earned
                </ThemedText>
            </View>
            <View style={styles.listContent}>
                {allBadges.map((item, index) => renderBadge({ item, index }))}
            </View>
            <BadgeDetailModal
                badge={selectedBadge}
                onClose={() => setSelectedBadge(null)}
                styles={styles}
            />
        </Animated.View>
    );
}

function BadgeDetailModal({
    badge,
    onClose,
    styles,
}: {
    badge: UserBadgeWithDefinition | null;
    onClose: () => void;
    styles: ReturnType<typeof createThemedStyles>;
}) {
    return (
        <Modal
            visible={badge !== null}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={styles.modalCard}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Animated.View
                        entering={BounceIn.springify().damping(14)}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalImageContainer}>
                            {badge?.image_url ? (
                                <Image
                                    source={{ uri: badge.image_url }}
                                    style={styles.modalBadgeImage}
                                    contentFit="contain"
                                />
                            ) : (
                                <View style={styles.modalBadgePlaceholder}>
                                    <ThemedText style={styles.modalPlaceholderEmoji}>
                                        🏅
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        <ThemedText style={styles.modalBadgeName}>
                            {badge?.name}
                        </ThemedText>
                        {badge?.is_featured && (
                            <View style={styles.featuredTag}>
                                <ThemedText style={styles.featuredTagText}>
                                    Featured
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText style={styles.modalBadgeDescription}>
                            {badge?.description}
                        </ThemedText>
                        {badge?.earned_at ? (
                            <ThemedText style={styles.modalEarnedDate}>
                                Earned{' '}
                                {new Date(badge.earned_at).toLocaleDateString(
                                    undefined,
                                    { month: 'long', day: 'numeric', year: 'numeric' }
                                )}
                            </ThemedText>
                        ) : (
                            <ThemedText style={styles.modalUnearnedText}>
                                Not yet earned
                            </ThemedText>
                        )}
                        <Pressable
                            style={({ pressed }) => [
                                styles.modalButton,
                                pressed && styles.modalButtonPressed,
                            ]}
                            onPress={onClose}
                        >
                            <ThemedText style={styles.modalButtonText}>
                                Close
                            </ThemedText>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginTop: theme.space.lg,
            marginBottom: theme.space.lg,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        title: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        badgeCount: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        listContent: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: theme.space.md,
            rowGap: theme.space.lg,
        },
        badgeWrapper: {
            width: '25%',
        },
        badgeItem: {
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: theme.space.xxs,
        },
        badgeItemPressed: {
            opacity: 0.7,
        },
        badgeImageContainer: {
            width: 76,
            height: 76,
            borderRadius: '100%',
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        badgeImageUnearned: {
            opacity: 0.35,
        },
        badgeImageFeatured: {
            borderWidth: 2,
            borderColor: '#F5C842',
            shadowColor: '#F5C842',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 4,
        },
        badgeImage: {
            width: 60,
            height: 60,
        },
        unearnedImage: {
            opacity: 0.4,
        },
        placeholderEmoji: {
            fontSize: 24,
        },
        badgeName: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            textAlign: 'center',
            fontWeight: theme.font.weight.medium,
        },
        unearnedText: {
            opacity: 0.4,
        },
        loadingContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyText: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            textAlign: 'center',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.space.xl,
        },
        modalCard: {
            width: '100%',
            maxWidth: 340,
        },
        modalContent: {
            backgroundColor: theme.color.bg,
            borderRadius: theme.radius.xl,
            paddingVertical: theme.space.xxl,
            paddingHorizontal: theme.space.xl,
            alignItems: 'center',
        },
        modalImageContainer: {
            marginBottom: theme.space.lg,
        },
        modalBadgeImage: {
            width: 100,
            height: 100,
        },
        modalBadgePlaceholder: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalPlaceholderEmoji: {
            fontSize: 48,
        },
        modalBadgeName: {
            fontSize: theme.font.size.xl,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            textAlign: 'center',
            marginBottom: theme.space.xs,
        },
        modalBadgeDescription: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            textAlign: 'center',
            lineHeight: theme.font.size.sm * 1.5,
            marginBottom: theme.space.md,
        },
        featuredTag: {
            backgroundColor: '#F5C842',
            borderRadius: theme.radius.pill,
            paddingVertical: theme.space.xxs,
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        featuredTagText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.bold,
            color: '#1a1a1a',
        },
        modalEarnedDate: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            marginBottom: theme.space.xl,
        },
        modalUnearnedText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            opacity: 0.6,
            marginBottom: theme.space.xl,
        },
        modalButton: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.pill,
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.xxl,
        },
        modalButtonPressed: {
            opacity: 0.7,
        },
        modalButtonText: {
            color: theme.color.textPrimary,
            fontWeight: theme.font.weight.semibold,
            fontSize: theme.font.size.md,
        },
    });
