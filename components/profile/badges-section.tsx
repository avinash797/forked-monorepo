import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useUserBadges } from '@/hooks/use-badges';
import type { UserBadge } from '@/types/badge.types';
import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface BadgesSectionProps {
    userId?: string;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
    const { theme } = useTheme();
    const { data: badges, isLoading } = useUserBadges(userId);
    const styles = createThemedStyles(theme);

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
        item: UserBadge;
        index: number;
    }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
                style={({ pressed }) => [
                    styles.badgeItem,
                    pressed && styles.badgeItemPressed,
                ]}
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
        </Animated.View>
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
    });
