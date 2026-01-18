import { EmptyState } from '@/components/browse/empty-state';
import DishTypePills from '@/components/Discover/dish-type-pills';
import {
    LeaderboardEntry,
    LeaderboardRow,
} from '@/components/Discover/leaderboard-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { useLocationStore } from '@/stores/location.store';
import { DishType } from '@/types/dishTypes';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItem,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_NOLA_ID = '2865c3db-1a51-464d-bd8e-1a49777a866f';

type LocationFilter = 'city' | 'near_me' | 'neighborhood';

export default function LeaderboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useMemo(
        () => createThemedStyles(theme, insets),
        [theme, insets]
    );

    const { currentCity, currentNeighborhood, getCurrentLocation } =
        useLocationStore();

    const [selectedDishType, setSelectedDishType] = useState<DishType | null>(
        null
    );
    const [locationFilter, setLocationFilter] =
        useState<LocationFilter>('city');

    // Use current city or fallback to NOLA
    const cityId = currentCity?.id || DEFAULT_NOLA_ID;
    const neighborhoodId = currentNeighborhood?.id;

    // Fetch leaderboard data
    const {
        data: leaderboardData,
        isLoading,
        error,
        refetch,
    } = useLeaderboard({
        cityId,
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

    // Get location on mount
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const handleDishTypeSelect = (dishType: DishType) => {
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

    const renderItem: ListRenderItem<LeaderboardEntry> = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(300 + index * 50).duration(400)}>
            <LeaderboardRow item={item} onPress={() => handleRowPress(item)} />
        </Animated.View>
    );

    const ListHeader = () => (
        <View style={styles.listHeader}>
            {/* Title */}
            <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>
                    Best {selectedDishType?.name || 'Dishes'}
                </ThemedText>
                <ThemedText style={styles.mainSubtitle}>
                    in {currentCity?.name || 'New Orleans'}
                </ThemedText>
            </View>

            {/* Dish Type Pills */}
            <DishTypePills
                selectedDishType={selectedDishType}
                handleDishTypeSelect={handleDishTypeSelect}
            />

            {/* Location Filter Toggle */}
            <View style={styles.filterContainer}>
                <Pressable
                    style={[
                        styles.filterButton,
                        locationFilter === 'city' && styles.filterButtonActive,
                    ]}
                    onPress={() => setLocationFilter('city')}
                >
                    <ThemedText
                        style={[
                            styles.filterText,
                            locationFilter === 'city' && styles.filterTextActive,
                        ]}
                    >
                        City
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={[
                        styles.filterButton,
                        locationFilter === 'near_me' &&
                            styles.filterButtonActive,
                    ]}
                    onPress={() => setLocationFilter('near_me')}
                >
                    <ThemedText
                        style={[
                            styles.filterText,
                            locationFilter === 'near_me' &&
                                styles.filterTextActive,
                        ]}
                    >
                        Near Me
                    </ThemedText>
                </Pressable>

                {neighborhoodId && (
                    <Pressable
                        style={[
                            styles.filterButton,
                            locationFilter === 'neighborhood' &&
                                styles.filterButtonActive,
                        ]}
                        onPress={() => setLocationFilter('neighborhood')}
                    >
                        <ThemedText
                            style={[
                                styles.filterText,
                                locationFilter === 'neighborhood' &&
                                    styles.filterTextActive,
                            ]}
                        >
                            {currentNeighborhood?.name || 'Neighborhood'}
                        </ThemedText>
                    </Pressable>
                )}
            </View>
        </View>
    );

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <EmptyState
                    icon="warning-outline"
                    title="Error Loading Leaderboard"
                    message={error instanceof Error ? error.message : 'Unknown error'}
                    actionLabel="Try Again"
                    onActionPress={() => refetch()}
                />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={leaderboardItems}
                keyExtractor={(item) => `${item.restaurant_id}-${item.rank}`}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <EmptyState
                                icon="restaurant-outline"
                                title="No Rankings Yet"
                                message={
                                    selectedDishType
                                        ? `No ${selectedDishType.name} has been rated yet. Be the first!`
                                        : 'Select a dish type to see rankings.'
                                }
                                actionLabel="Rate a Dish"
                                onActionPress={() =>
                                    router.push('/(protected)/(rating)')
                                }
                            />
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => refetch()}
                        tintColor={theme.color.accent}
                        progressViewOffset={insets.top + 20}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Loading Overlay */}
            {isLoading && leaderboardItems.length === 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.color.accent} />
                    <ThemedText style={styles.loadingText}>
                        Loading rankings...
                    </ThemedText>
                </View>
            )}
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
        },
        mainSubtitle: {
            fontSize: theme.font.size.lg,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        filterContainer: {
            flexDirection: 'row',
            paddingHorizontal: theme.space.md,
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
            paddingHorizontal: theme.space.md,
            paddingBottom: insets.bottom + 100, // Space for bottom tab
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
