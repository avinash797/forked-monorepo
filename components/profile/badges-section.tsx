import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useUserBadges } from '@/hooks/use-badges';
import type { UserBadgeWithDefinition } from '@/types/badge.types';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { BounceIn, FadeInDown } from 'react-native-reanimated';

interface BadgesSectionProps {
    userId?: string;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
    const { theme } = useTheme();
    const { data: badges, isLoading } = useUserBadges(userId);
    const styles = createThemedStyles(theme);
    const [selectedBadge, setSelectedBadge] = useState<UserBadgeWithDefinition | null>(null);

    const earnedBadges = badges?.filter((b) => b.earned_at !== null) ?? [];
    const totalBadges = badges?.filter((b) => b.is_active).length ?? 0;

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

    if (earnedBadges.length === 0) {
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
                        Keep rating and battling to earn badges!
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
    }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
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
                        item.is_featured && styles.badgeImageFeatured,
                    ]}
                >
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.badgeImage}
                            contentFit="contain"
                        />
                    ) : (
                        <ThemedText style={styles.placeholderEmoji}>
                            🏅
                        </ThemedText>
                    )}
                </ThemedView>
                <ThemedText style={styles.badgeName} numberOfLines={2}>
                    {item.name}
                </ThemedText>
            </Pressable>
        </Animated.View>
    );

    return (
        <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.container}
        >
            <View style={styles.header}>
                <ThemedText style={styles.title}>Badges</ThemedText>
                <ThemedText style={styles.badgeCount}>
                    {earnedBadges.length} of {totalBadges} earned
                </ThemedText>
            </View>
            <FlatList
                data={earnedBadges}
                renderItem={renderBadge}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
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
                        <ThemedText style={styles.modalBadgeDescription}>
                            {badge?.description}
                        </ThemedText>
                        {badge?.earned_at && (
                            <ThemedText style={styles.modalEarnedDate}>
                                Earned{' '}
                                {new Date(badge.earned_at).toLocaleDateString(
                                    undefined,
                                    { month: 'long', day: 'numeric', year: 'numeric' }
                                )}
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
            paddingHorizontal: theme.space.md,
            gap: theme.space.sm,
        },
        badgeItem: {
            alignItems: 'center',
            width: 80,
            padding: theme.space.sm,
        },
        badgeItemPressed: {
            opacity: 0.7,
        },
        badgeImageContainer: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.space.xs,
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
            width: 40,
            height: 40,
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
        modalEarnedDate: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
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
