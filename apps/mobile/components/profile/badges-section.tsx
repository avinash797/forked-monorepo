import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { useUserBadges } from '@/hooks/use-badges';
import type { UserBadgeWithDefinition } from '@forked/supabase';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BadgeDetailModal } from '../badges/badge-detail-modal';
import { BadgeItem } from '../badges/badge-item';
import { createBadgeStyles } from '../badges/badge-styles';

interface BadgesSectionProps {
    userId?: string;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
    const { theme } = useTheme();
    const { data: badges, isLoading } = useUserBadges(userId);
    const styles = createBadgeStyles(theme);
    const [selectedBadge, setSelectedBadge] =
        useState<UserBadgeWithDefinition | null>(null);

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
                {allBadges.map((item, index) => (
                    <BadgeItem
                        key={item.id}
                        item={item}
                        index={index}
                        onPress={setSelectedBadge}
                        styles={styles}
                    />
                ))}
            </View>
            <BadgeDetailModal
                badge={selectedBadge}
                onClose={() => setSelectedBadge(null)}
                styles={styles}
            />
        </Animated.View>
    );
}
