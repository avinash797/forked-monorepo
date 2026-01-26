import { EmptyState } from '@/components/browse/empty-state';
import DishTypePills from '@/components/Discover/dish-type-pills';
import { LeaderboardRow } from '@/components/Discover/leaderboard-row';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { useMyDishRankings } from '@/hooks/use-ratings';
import { DishType } from '@/types/dishType';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const personal = () => {
    const router = useRouter();

    const { theme } = useTheme();
    const styles = useMemo(() => createThemedStyles(theme), [theme]);

    const [selectedDishType, setSelectedDishType] = useState<DishType | null>(
        null
    );

    const {
        data: dishRankingsData,
        isLoading: isLoadingDishRankings,
        refetch,
    } = useMyDishRankings(selectedDishType?.id);

    const dishRankings = Array.isArray(dishRankingsData)
        ? dishRankingsData
        : [];

    const ListHeader = () => (
        <View style={styles.listHeader}>
            {/* Title */}
            <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>
                    Your Best {selectedDishType?.name || 'Dishes'}
                </ThemedText>
            </View>
        </View>
    );
    return (
        <SafeAreaView style={styles.container}>
            <ListHeader />
            <DishTypePills
                selectedDishType={selectedDishType}
                handleDishTypeSelect={setSelectedDishType}
                view="personal"
            />
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isLoadingDishRankings}
                        onRefresh={() => refetch()}
                        tintColor={theme.color.accent}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {!isLoadingDishRankings && dishRankings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            icon="restaurant-outline"
                            title="No Rankings Yet"
                            message={
                                selectedDishType
                                    ? `You don't seem to have rated any ${selectedDishType.name} yet. Start by rating one!`
                                    : 'This is where you will see your best dishes. \nStart by rating one!'
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
                        <LeaderboardRow item={item} onPress={() => {}} />
                    </Animated.View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default personal;

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        listHeader: {
            paddingTop: theme.space.md,
        },
        titleSection: {
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        mainTitle: {
            fontSize: theme.font.size.xxl + 4,
            fontWeight: '800',
            color: theme.color.textPrimary,
            letterSpacing: -0.5,
            lineHeight: theme.font.size.xxl + 6,
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
