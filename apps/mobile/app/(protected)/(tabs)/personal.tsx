import { EmptyState } from '@/components/browse/empty-state';
import DishTypePills from '@/components/Discover/dish-type-pills';
import {
    PersonalLeaderboardRow,
    PersonalLeaderboardRowSkeleton,
} from '@/components/Discover/personal-leaderboard-row';
import { LeaderboardShareModal } from '@/components/share/leaderboard-share-modal';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDishTypes } from '@/hooks/use-dish-types';
import { useMyDishRankings } from '@/hooks/use-ratings';
import { useUserStats } from '@/hooks/use-user-stats';
import { DishType } from '@forked/types/dishes';
import type { PersonalRankingEntry } from '@forked/supabase';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PersonalScreen = () => {
    const router = useRouter();

    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(
        () => createThemedStyles(theme, insets),
        [theme, insets]
    );
    const { user } = useAuth();

    const [selectedDishType, setSelectedDishType] = useState<DishType | null>(
        null
    );
    const [shareModalVisible, setShareModalVisible] = useState(false);

    // Fetch dish types and user stats, then filter to only types the user has rated
    const { data: allDishTypes, isPending: isDishTypesPending } =
        useDishTypes();
    const { data: userStats, isPending: isUserStatsPending } = useUserStats(
        user?.id
    );

    const personalDishTypes = useMemo(() => {
        if (!userStats?.dishes_by_type) return [];
        return (
            allDishTypes?.filter((dt) =>
                Object.keys(userStats.dishes_by_type ?? {}).includes(dt.name)
            ) ?? []
        );
    }, [allDishTypes, userStats]);

    const {
        data: dishRankingsData,
        isPending: isDishRankingsPending,
        isFetching: isDishRankingsFetching,
        refetch,
    } = useMyDishRankings(selectedDishType?.id);

    const dishRankings = Array.isArray(dishRankingsData)
        ? dishRankingsData
        : [];

    const canShare = dishRankings.length > 0 && !!selectedDishType;

    const handleRowPress = (item: PersonalRankingEntry) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: item.restaurant_id,
                dishTypeId: selectedDishType?.id || '',
            },
        });
    };

    return (
        <View style={styles.container}>
            <LeaderboardShareModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                dishTypeName={selectedDishType?.name ?? ''}
                dishTypeIcon={selectedDishType?.icon ?? undefined}
                dishTypeEmoji={selectedDishType?.emoji ?? undefined}
                cityName=""
                username={user?.display_name ?? ''}
                entries={dishRankings}
                isPersonal
            />
            <View style={styles.listHeader}>
                <View style={styles.titleSection}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.mainTitle}>
                            {`Your Best ${selectedDishType?.name || 'Dishes'}`}
                            {/* {`Your Best ${selectedDishType?.name || 'Dishes'}`} */}
                        </ThemedText>
                        {canShare && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.shareBtn,
                                    pressed && styles.shareBtnPressed,
                                ]}
                                onPress={() => setShareModalVisible(true)}
                                hitSlop={8}
                            >
                                <IconSymbol
                                    name="share-outline"
                                    size={20}
                                    color={theme.color.accent}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
            <DishTypePills
                dishTypes={personalDishTypes}
                selectedDishType={selectedDishType}
                handleDishTypeSelect={setSelectedDishType}
            />
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={
                            isDishRankingsFetching && !isDishRankingsPending
                        }
                        onRefresh={() => refetch()}
                        tintColor={theme.color.accent}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
            >
                {isDishTypesPending ||
                isUserStatsPending ||
                (selectedDishType && isDishRankingsPending)
                    ? [0, 1, 2, 3, 4].map((i) => (
                          <PersonalLeaderboardRowSkeleton key={i} />
                      ))
                    : null}

                {!isDishTypesPending &&
                !isUserStatsPending &&
                !selectedDishType &&
                personalDishTypes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            icon="restaurant-outline"
                            title="No Rankings Yet"
                            message={
                                'This is where you will see your best dishes. \nStart by rating one!'
                            }
                            actionLabel="Rate a Dish"
                            onActionPress={() =>
                                router.push('/(protected)/(rating)')
                            }
                        />
                    </View>
                ) : null}

                {dishRankings.map((item, index) => (
                    <Animated.View
                        entering={FadeInDown.delay(300 + index * 50).duration(
                            400
                        )}
                        key={`${item.restaurant_id}-${item.rank}`}
                    >
                        <PersonalLeaderboardRow
                            item={item}
                            onPress={() => handleRowPress(item)}
                        />
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
};

export default PersonalScreen;

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: ReturnType<typeof useSafeAreaInsets>
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        listHeader: {
            paddingTop: insets.top + theme.space.md,
        },
        titleSection: {
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        shareBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.color.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        shareBtnPressed: {
            opacity: 0.75,
            transform: [{ scale: 0.95 }],
        },
        mainTitle: {
            fontSize: theme.font.size.xxl + 4,
            fontWeight: '800',
            color: theme.color.textPrimary,
            letterSpacing: -0.5,
            lineHeight: theme.font.size.xxl + 6,
            flex: 1,
            flexGrow: 1,
            flexWrap: 'wrap',
        },
        mainSubtitle: {
            fontSize: theme.font.size.lg,
            lineHeight: theme.font.size.lg + 4,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        filterContainer: {
            flexDirection: 'row',
            paddingVertical: theme.space.sm,
            gap: theme.space.xs,
        },
        filterButton: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xs + 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        filterButtonActive: {
            backgroundColor: theme.color.accent,
            borderColor: theme.color.accent,
        },
        filterText: {
            fontSize: theme.font.size.sm,
            fontWeight: '600',
            color: theme.color.textSecondary,
        },
        filterTextActive: {
            color: theme.color.accentOn,
        },
        listContent: {
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.md,
        },
        emptyContainer: {
            paddingTop: 60,
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            gap: theme.space.md,
        },
        loadingText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
    });
