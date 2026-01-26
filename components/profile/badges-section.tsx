import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useUserBadges } from '@/hooks/use-user-stats';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface BadgesSectionProps {
    userId?: string;
}

interface ComputedBadge {
    id: string;
    name: string;
    description: string;
    emoji: string;
    earned: boolean;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
    const { theme } = useTheme();
    const { data: badges, isLoading } = useUserBadges(userId);
    const styles = createThemedStyles(theme);

    // Filter to only show earned badges
    const earnedBadges = badges?.filter((b) => b.earned) ?? [];

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

    const renderBadge = ({ item, index }: { item: ComputedBadge; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
                style={({ pressed }) => [
                    styles.badgeItem,
                    pressed && styles.badgeItemPressed,
                ]}
            >
                <ThemedView style={styles.badgeEmoji}>
                    <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
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
                    {earnedBadges.length} earned
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
        badgeEmoji: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        emoji: {
            fontSize: 28,
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
