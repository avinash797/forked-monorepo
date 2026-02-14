import { EmptyState } from '@/components/browse/empty-state';
import DishTypePills from '@/components/Discover/dish-type-pills';
import {
    LeaderboardEntry,
    LeaderboardRow,
} from '@/components/Discover/leaderboard-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useGetLeaderboardByDishType } from '@/hooks/use-leaderboard';
import { useLocationFilterStore } from '@/stores';
import { DishType } from '@/types/dishes';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LocationFilter = 'city' | 'near_me' | 'neighborhood';

export default function LeaderboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useMemo(
        () => createThemedStyles(theme, insets),
        [theme, insets]
    );

    const {
        filterType,
        selectedCityId,
        selectedCityName,
        selectedNeighborhoodId,
        nearbyConfig,
    } = useLocationFilterStore();

    const [selectedDishType, setSelectedDishType] = useState<DishType | null>(
        null
    );

    // Use current city or fallback to NOLA
    const cityId = selectedCityId;

    // Fetch leaderboard data
    const {
        data: leaderboardData,
        isLoading,
        error,
        refetch,
    } = useGetLeaderboardByDishType({
        cityId: cityId ?? '',
        dishTypeId: selectedDishType?.id || '',
        limit: 10,
    });

    // Process data to add rank
    const leaderboardItems: LeaderboardEntry[] = useMemo(() => {
        if (!leaderboardData) return [];
        return leaderboardData.map((item: any, index: number) => ({
            ...item,
            rank: item.rank || index + 1,
        }));
    }, [leaderboardData]);

    const handleDishTypeSelect = (dishType: DishType | null) => {
        setSelectedDishType(dishType);
    };

    const handleRowPress = (item: LeaderboardEntry) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: item.restaurant_id,
                dishTypeId: selectedDishType?.id || '',
            },
        });
    };

    const ListHeader = () => (
        <View style={styles.listHeader}>
            {/* Title */}
            <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>
                    Best {selectedDishType?.name || 'Dishes'}
                </ThemedText>
                <ThemedText style={styles.mainSubtitle}>
                    in {selectedCityName}
                </ThemedText>
            </View>
        </View>
    );

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <EmptyState
                    icon="warning-outline"
                    title="Error Loading Leaderboard"
                    message={
                        error instanceof Error ? error.message : 'Unknown error'
                    }
                    actionLabel="Try Again"
                    onActionPress={() => refetch()}
                />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ListHeader />
            <DishTypePills
                selectedDishType={selectedDishType}
                handleDishTypeSelect={handleDishTypeSelect}
            />
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => refetch()}
                        tintColor={theme.color.accent}
                        progressViewOffset={insets.top + 20}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {!isLoading && leaderboardItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            icon="restaurant-outline"
                            title="No Rankings Yet"
                            message={`There's not enough ${selectedDishType?.name || 'dishes'} ratings yet in ${selectedCityName}. \nBe the trendsetter and rate one!`}
                            actionLabel="Rate a Dish"
                            onActionPress={() =>
                                router.push('/(protected)/(rating)')
                            }
                        />
                    </View>
                ) : null}

                {leaderboardItems.map((item, index) => (
                    <Animated.View
                        entering={FadeInDown.delay(300 + index * 50).duration(
                            400
                        )}
                        key={`${item.restaurant_id}-${item.rank}`}
                    >
                        <LeaderboardRow
                            item={item}
                            onPress={() => handleRowPress(item)}
                        />
                    </Animated.View>
                ))}
            </ScrollView>
        </ThemedView>
    );
}

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
