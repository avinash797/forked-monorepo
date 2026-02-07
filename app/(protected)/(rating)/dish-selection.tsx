import { SearchInput } from '@/components/rating/search-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import {
    DishTypeVariation,
    groupVariationsByDishType,
    useAllDishTypeVariations,
} from '@/hooks/use-dish-type-variations';
import { PrioritizedDishType, useCityDishTypes } from '@/hooks/use-dish-types';
import {
    RestaurantDishWithDetails,
    useRestaurantDishes,
} from '@/hooks/use-restaurant-dishes';
import { useRatingStore } from '@/stores';
import { DishType } from '@/types/dishes';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SectionList,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RestaurantDishSection {
    key: 'top' | 'all-restaurant';
    title: string;
    data: RestaurantDishWithDetails[];
}

interface DishTypeSection {
    key: 'city' | 'other';
    title: string;
    data: PrioritizedDishType[];
}

type Section = RestaurantDishSection | DishTypeSection;

function isRestaurantDishSection(
    section: Section
): section is RestaurantDishSection {
    return section.key === 'top' || section.key === 'all-restaurant';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DishSelectionScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const { selectedRestaurant, setSelectedDishType, setSelectedVariationId } =
        useRatingStore();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    // Track which dish_type is expanded (for variation chip selection)
    const [expandedDishTypeId, setExpandedDishTypeId] = useState<string | null>(
        null
    );

    // Data hooks
    const { data: restaurantDishes, isLoading: isLoadingRestDishes } =
        useRestaurantDishes(selectedRestaurant?.id);
    const { data: dishTypes, isLoading: isLoadingDishTypes } = useCityDishTypes(
        selectedRestaurant?.city_id
    );
    const { data: allVariations = [] } = useAllDishTypeVariations();

    const variationsByDishType = useMemo(
        () => groupVariationsByDishType(allVariations),
        [allVariations]
    );

    useEffect(() => {
        if (!selectedRestaurant) {
            router.back();
        }
    }, [selectedRestaurant, router]);

    if (!selectedRestaurant) return null;

    // ─── Derived data ────────────────────────────────────────────────────────

    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Top 5 most rated restaurant dishes
    const top5RestaurantDishes = useMemo(() => {
        if (!restaurantDishes?.length) return [];
        return restaurantDishes
            .filter((rd) => (rd.total_ratings ?? 0) > 0)
            .slice(0, 5);
    }, [restaurantDishes]);

    // All restaurant dishes sorted alphabetically
    const allRestaurantDishes = useMemo(() => {
        if (!restaurantDishes?.length) return [];
        return [...restaurantDishes].sort((a, b) => {
            const nameA = getRestaurantDishDisplayName(a).toLowerCase();
            const nameB = getRestaurantDishDisplayName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [restaurantDishes]);

    // Split dish types: city-known vs others
    const { cityDishTypes, otherDishTypes } = useMemo(() => {
        if (!dishTypes) return { cityDishTypes: [], otherDishTypes: [] };
        return {
            cityDishTypes: dishTypes.filter((dt) => dt.isCityKnown),
            otherDishTypes: dishTypes.filter((dt) => !dt.isCityKnown),
        };
    }, [dishTypes]);

    // ─── Filtered data for search ────────────────────────────────────────────

    const filteredRestaurantDishes = useMemo(() => {
        if (!normalizedQuery) return allRestaurantDishes;
        return allRestaurantDishes.filter((rd) =>
            matchesRestaurantDish(rd, normalizedQuery)
        );
    }, [allRestaurantDishes, normalizedQuery]);

    const filteredCityDishTypes = useMemo(() => {
        if (!normalizedQuery) return cityDishTypes;
        return cityDishTypes.filter((dt) =>
            matchesDishType(dt, normalizedQuery)
        );
    }, [cityDishTypes, normalizedQuery]);

    const filteredOtherDishTypes = useMemo(() => {
        if (!normalizedQuery) return otherDishTypes;
        return otherDishTypes.filter((dt) =>
            matchesDishType(dt, normalizedQuery)
        );
    }, [otherDishTypes, normalizedQuery]);

    // ─── Build sections for SectionList ──────────────────────────────────────

    const sections: Section[] = useMemo(() => {
        const result: Section[] = [];

        if (normalizedQuery) {
            // While searching: group into "At [Restaurant]" vs "Dish Types"
            if (filteredRestaurantDishes.length > 0) {
                result.push({
                    key: 'all-restaurant',
                    title: `At ${selectedRestaurant.name}`,
                    data: filteredRestaurantDishes,
                });
            }
            const combinedDishTypes = [
                ...filteredCityDishTypes,
                ...filteredOtherDishTypes,
            ];
            if (combinedDishTypes.length > 0) {
                result.push({
                    key: 'other',
                    title: 'Dish Types',
                    data: combinedDishTypes,
                });
            }
        } else {
            // Default view: structured sections
            if (top5RestaurantDishes.length > 0) {
                result.push({
                    key: 'top',
                    title: 'Most Rated Here',
                    data: top5RestaurantDishes,
                });
            }
            if (allRestaurantDishes.length > 0) {
                result.push({
                    key: 'all-restaurant',
                    title: `All Dishes at ${selectedRestaurant.name}`,
                    data: allRestaurantDishes,
                });
            }
            if (filteredCityDishTypes.length > 0) {
                result.push({
                    key: 'city',
                    title: 'Popular in This City',
                    data: filteredCityDishTypes,
                });
            }
            if (filteredOtherDishTypes.length > 0) {
                result.push({
                    key: 'other',
                    title: 'More Dishes',
                    data: filteredOtherDishTypes,
                });
            }
        }

        return result;
    }, [
        normalizedQuery,
        top5RestaurantDishes,
        allRestaurantDishes,
        filteredRestaurantDishes,
        filteredCityDishTypes,
        filteredOtherDishTypes,
        selectedRestaurant.name,
    ]);

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if a (dish_type_id, variation_id) combination already exists in
     * this restaurant's restaurant_dishes. If it does, return the existing
     * entry so we reuse it instead of risking a duplicate.
     */
    const findExistingRestaurantDish = useCallback(
        (dishTypeId: string, variationId: string | null) => {
            if (!restaurantDishes?.length) return null;
            return (
                restaurantDishes.find(
                    (rd) =>
                        rd.dish_type_id === dishTypeId &&
                        rd.variation_id === (variationId ?? null)
                ) ?? null
            );
        },
        [restaurantDishes]
    );

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleRestaurantDishSelect = useCallback(
        (item: RestaurantDishWithDetails) => {
            setSelectedDishType(item.dish_type as DishType);
            setSelectedVariationId(item.variation_id);
            router.push('/(protected)/(rating)/rating');
        },
        [setSelectedDishType, setSelectedVariationId, router]
    );

    const handleDishTypeSelect = useCallback(
        (dishType: PrioritizedDishType) => {
            const variations = variationsByDishType.get(dishType.id);
            if (variations && variations.length > 0) {
                // Expand to show variation chips
                setExpandedDishTypeId(
                    expandedDishTypeId === dishType.id ? null : dishType.id
                );
            } else {
                // No variations: check if this dish_type already exists
                // in restaurant_dishes (with null variation) to avoid duplicates
                const existing = findExistingRestaurantDish(dishType.id, null);
                if (existing) {
                    setSelectedDishType(existing.dish_type as DishType);
                    setSelectedVariationId(existing.variation_id);
                } else {
                    setSelectedDishType(dishType);
                    setSelectedVariationId(null);
                }
                router.push('/(protected)/(rating)/rating');
            }
        },
        [
            variationsByDishType,
            expandedDishTypeId,
            findExistingRestaurantDish,
            setSelectedDishType,
            setSelectedVariationId,
            router,
        ]
    );

    const handleVariationSelect = useCallback(
        (dishType: PrioritizedDishType, variation: DishTypeVariation) => {
            // Check if this (dish_type, variation) combo already exists
            // in restaurant_dishes to avoid creating a duplicate entry
            const existing = findExistingRestaurantDish(
                dishType.id,
                variation.id
            );
            if (existing) {
                setSelectedDishType(existing.dish_type as DishType);
                setSelectedVariationId(existing.variation_id);
            } else {
                setSelectedDishType(dishType);
                setSelectedVariationId(variation.id);
            }
            router.push('/(protected)/(rating)/rating');
        },
        [
            findExistingRestaurantDish,
            setSelectedDishType,
            setSelectedVariationId,
            router,
        ]
    );

    // ─── Render helpers ──────────────────────────────────────────────────────

    const renderSectionHeader = useCallback(
        ({ section }: { section: Section }) => (
            <View style={styles.sectionHeaderContainer}>
                <ThemedText style={styles.sectionTitle}>
                    {section.title}
                </ThemedText>
            </View>
        ),
        [styles]
    );

    const renderItem = useCallback(
        ({
            item,
            section,
            index,
        }: {
            item: RestaurantDishWithDetails | PrioritizedDishType;
            section: Section;
            index: number;
        }) => {
            if (isRestaurantDishSection(section)) {
                const rd = item as RestaurantDishWithDetails;
                return (
                    <Animated.View
                        entering={FadeInDown.delay(index * 50).duration(300)}
                    >
                        <RestaurantDishRow
                            item={rd}
                            onPress={handleRestaurantDishSelect}
                            theme={theme}
                            styles={styles}
                        />
                    </Animated.View>
                );
            }

            const dt = item as PrioritizedDishType;
            const isExpanded = expandedDishTypeId === dt.id;
            const variations = variationsByDishType.get(dt.id) ?? [];

            return (
                <Animated.View
                    entering={FadeInDown.delay(index * 50).duration(300)}
                >
                    <DishTypeRow
                        item={dt}
                        isExpanded={isExpanded}
                        variations={variations}
                        onPress={handleDishTypeSelect}
                        onVariationSelect={handleVariationSelect}
                        theme={theme}
                        styles={styles}
                    />
                </Animated.View>
            );
        },
        [
            expandedDishTypeId,
            variationsByDishType,
            handleRestaurantDishSelect,
            handleDishTypeSelect,
            handleVariationSelect,
            theme,
            styles,
        ]
    );

    const isLoading = isLoadingRestDishes || isLoadingDishTypes;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'What did you eat?',
                    headerBackTitle: 'Back',
                }}
            />
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.restaurantName}>
                        {selectedRestaurant.name}
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Select the dish you&apos;re rating
                    </ThemedText>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <SearchInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search dishes..."
                    />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={theme.color.accent}
                        />
                    </View>
                ) : sections.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>
                            No dishes found
                            {normalizedQuery ? ` for "${searchQuery}"` : ''}
                        </ThemedText>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item, index) => {
                            if ('dish_type' in item) {
                                return `rd-${(item as RestaurantDishWithDetails).id}`;
                            }
                            return `dt-${(item as PrioritizedDishType).id}-${index}`;
                        }}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        stickySectionHeadersEnabled={false}
                    />
                )}
            </ThemedView>
        </>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RestaurantDishRow({
    item,
    onPress,
    theme,
    styles,
}: {
    item: RestaurantDishWithDetails;
    onPress: (item: RestaurantDishWithDetails) => void;
    theme: ReturnType<typeof useTheme>['theme'];
    styles: ReturnType<typeof createThemedStyles>;
}) {
    const displayName = getRestaurantDishDisplayName(item);
    const ratingCount = item.total_ratings ?? 0;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.itemCard,
                pressed && styles.itemCardPressed,
            ]}
            onPress={() => onPress(item)}
        >
            <ThemedText style={styles.itemEmoji}>
                {item.dish_type.emoji ?? '🍽️'}
            </ThemedText>
            <View style={styles.itemContent}>
                <ThemedText style={styles.itemName} numberOfLines={1}>
                    {displayName}
                </ThemedText>
                {ratingCount > 0 && (
                    <ThemedText style={styles.itemMeta}>
                        {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
                    </ThemedText>
                )}
            </View>
        </Pressable>
    );
}

function DishTypeRow({
    item,
    isExpanded,
    variations,
    onPress,
    onVariationSelect,
    theme,
    styles,
}: {
    item: PrioritizedDishType;
    isExpanded: boolean;
    variations: DishTypeVariation[];
    onPress: (item: PrioritizedDishType) => void;
    onVariationSelect: (dt: PrioritizedDishType, v: DishTypeVariation) => void;
    theme: ReturnType<typeof useTheme>['theme'];
    styles: ReturnType<typeof createThemedStyles>;
}) {
    const hasVariations = variations.length > 0;

    return (
        <View>
            <Pressable
                style={({ pressed }) => [
                    styles.itemCard,
                    isExpanded && styles.itemCardExpanded,
                    pressed && styles.itemCardPressed,
                ]}
                onPress={() => onPress(item)}
            >
                <ThemedText style={styles.itemEmoji}>
                    {item.emoji ?? '🍽️'}
                </ThemedText>
                <View style={styles.itemContent}>
                    <ThemedText style={styles.itemName} numberOfLines={1}>
                        {item.name}
                    </ThemedText>
                    {item.aliases && item.aliases.length > 0 && (
                        <ThemedText style={styles.itemMeta}>
                            {item.aliases.slice(0, 2).join(', ')}
                        </ThemedText>
                    )}
                </View>
                {hasVariations && (
                    <ThemedText style={styles.chevron}>
                        {isExpanded ? '▲' : '▼'}
                    </ThemedText>
                )}
            </Pressable>

            {/* Variation chips */}
            {isExpanded && hasVariations && (
                <Animated.View
                    entering={FadeInDown.duration(200)}
                    style={styles.variationsContainer}
                >
                    <ThemedText style={styles.variationsLabel}>
                        Select a variation:
                    </ThemedText>
                    <View style={styles.chipsRow}>
                        {variations.map((v) => (
                            <Pressable
                                key={v.id}
                                style={({ pressed }) => [
                                    styles.chip,
                                    pressed && styles.chipPressed,
                                ]}
                                onPress={() => onVariationSelect(item, v)}
                            >
                                {v.emoji && (
                                    <ThemedText style={styles.chipEmoji}>
                                        {v.emoji}
                                    </ThemedText>
                                )}
                                <ThemedText style={styles.chipText}>
                                    {v.name}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRestaurantDishDisplayName(item: RestaurantDishWithDetails): string {
    const base = item.dish_type.name;
    if (item.variation) {
        return `${base} (${item.variation.name})`;
    }
    return base;
}

function matchesRestaurantDish(
    rd: RestaurantDishWithDetails,
    query: string
): boolean {
    const name = rd.dish_type.name.toLowerCase();
    const variationName = rd.variation?.name.toLowerCase() ?? '';
    const aliases = rd.dish_type.aliases?.map((a) => a.toLowerCase()) ?? [];
    return (
        name.includes(query) ||
        variationName.includes(query) ||
        aliases.some((a) => a.includes(query))
    );
}

function matchesDishType(dt: PrioritizedDishType, query: string): boolean {
    const name = dt.name.toLowerCase();
    const aliases = dt.aliases?.map((a) => a.toLowerCase()) ?? [];
    return name.includes(query) || aliases.some((a) => a.includes(query));
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        header: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.md,
            marginBottom: theme.space.sm,
        },
        restaurantName: {
            fontSize: theme.font.size.xl,
            fontWeight: '700',
            color: theme.color.textPrimary,
            marginBottom: theme.space.xs,
        },
        subtitle: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        searchContainer: {
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.sm,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.xxl,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.xxl,
        },
        emptyText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            textAlign: 'center',
        },
        listContent: {
            paddingHorizontal: theme.space.md,
            paddingBottom: 100,
        },
        sectionHeaderContainer: {
            paddingTop: theme.space.lg,
            paddingBottom: theme.space.sm,
            backgroundColor: theme.color.bg,
        },
        sectionTitle: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textSecondary,
        },
        // ─── Item card (shared for both restaurant dishes and dish types) ────
        itemCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.md,
            marginBottom: theme.space.xs,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        itemCardPressed: {
            backgroundColor: theme.color.surface2,
        },
        itemCardExpanded: {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            marginBottom: 0,
        },
        itemEmoji: {
            fontSize: 28,
            marginRight: theme.space.sm,
        },
        itemContent: {
            flex: 1,
        },
        itemName: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textPrimary,
        },
        itemMeta: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
            marginTop: 2,
        },
        chevron: {
            fontSize: 12,
            color: theme.color.textTertiary,
            marginLeft: theme.space.xs,
        },
        // ─── Variations ─────────────────────────────────────────────────────
        variationsContainer: {
            padding: theme.space.md,
            paddingTop: theme.space.sm,
            marginBottom: theme.space.xs,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: theme.color.border,
            borderBottomLeftRadius: theme.radius.md,
            borderBottomRightRadius: theme.radius.md,
        },
        variationsLabel: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginBottom: theme.space.sm,
        },
        chipsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.xs,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.color.accent,
            backgroundColor: 'transparent',
            gap: 4,
        },
        chipPressed: {
            backgroundColor: theme.color.accent,
        },
        chipEmoji: {
            fontSize: 14,
        },
        chipText: {
            fontSize: theme.font.size.sm,
            fontWeight: '500',
            color: theme.color.accent,
        },
    });
