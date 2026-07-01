import { EmptyState } from '@/components/browse/empty-state';
import { SearchInput } from '@/components/rating/search-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { GooglePlaceSuggestion } from '@/hooks/use-address-search';
import {
    RestaurantDishSearchResult,
    RestaurantSearchItem,
    SearchResults,
    useSearch,
} from '@/hooks/use-search';
import { buildUpsertRestaurantParams } from '@/lib/restaurant-params';
import { supabase } from '@/lib/supabase';
import { DishType } from '@forked/types/dishes';
import { LocationProperties } from '@forked/types/restaurant';
import { Database } from '@forked/supabase';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SearchTab = 'dishes' | 'restaurants';

type DishTabItem =
    | { type: 'dish-type'; data: DishType }
    | { type: 'food-item'; data: RestaurantDishSearchResult };

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('dishes');
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const {
        data: results,
        isFetching: isLoading,
        error: searchError,
        selectAddress,
    } = useSearch(query);
    const error = searchError ? (searchError as Error).message : null;

    const {
        dishTypes = [],
        restaurants = [],
        restaurantDishes = [],
    } = results ?? ({} as Partial<SearchResults>);

    const hasResults =
        dishTypes.length > 0 ||
        restaurants.length > 0 ||
        restaurantDishes.length > 0;

    // ── Navigation handlers ─────────────────────────────────────────────

    const handleDishTypePress = (dishType: DishType) => {
        router.push({
            pathname: '/(protected)/(tabs)/leaderboard',
            params: { dishTypeId: dishType.id },
        });
    };

    const handleDbRestaurantPress = (
        restaurant: Database['public']['Tables']['restaurants']['Row']
    ) => {
        router.push({
            pathname: '/(protected)/(browse)/restaurant-detail',
            params: { venueId: restaurant.id, source: 'search' },
        });
    };

    const handleGoogleRestaurantPress = async (
        suggestion: GooglePlaceSuggestion
    ) => {
        try {
            const placeId = suggestion.placePrediction.placeId;
            const addressData = await selectAddress(placeId);

            if (!addressData) {
                Alert.alert('Error', 'Could not retrieve restaurant details');
                return;
            }

            const { data: result, error: rpcError } = await supabase.rpc(
                'upsert_restaurant_from_google',
                buildUpsertRestaurantParams(addressData)
            );

            if (rpcError) {
                Alert.alert('Error', rpcError.message);
                return;
            }

            if (!result || !result[0]) {
                Alert.alert('Error', 'Failed to create restaurant');
                return;
            }

            router.push({
                pathname: '/(protected)/(browse)/restaurant-detail',
                params: { venueId: result[0].id, source: 'search' },
            });
        } catch (err) {
            Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Something went wrong'
            );
        }
    };

    const handleFoodItemPress = (item: RestaurantDishSearchResult) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: {
                restaurantId: item.restaurant_id,
                dishTypeId: item.dish_type_id,
            },
        });
    };

    // ── Tab bar ─────────────────────────────────────────────────────────

    const dishTabItems: DishTabItem[] = [
        ...dishTypes.map((d) => ({ type: 'dish-type' as const, data: d })),
        ...restaurantDishes.map((d) => ({
            type: 'food-item' as const,
            data: d,
        })),
    ];

    const tabs: { key: SearchTab; label: string; count: number }[] = [
        { key: 'dishes', label: 'Dishes', count: dishTabItems.length },
        { key: 'restaurants', label: 'Restaurants', count: restaurants.length },
    ];

    const showCounts = query.length >= 2 && !isLoading;

    // ── Result row components ───────────────────────────────────────────

    const renderDishTypeRow = ({ item: dishType }: { item: DishType }) => (
        <Pressable
            onPress={() => handleDishTypePress(dishType)}
            style={({ pressed }) => [
                styles.resultRow,
                pressed && { opacity: 0.7 },
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        >
            <View style={styles.emojiContainer}>
                <DishTypeIcon
                    icon={dishType.icon}
                    emoji={dishType.emoji}
                    size={20}
                />
            </View>
            <View style={styles.resultTextContainer}>
                <ThemedText style={styles.resultTitle} numberOfLines={1}>
                    {dishType.name} Leaderboard
                </ThemedText>
            </View>
            <IconSymbol
                name="chevron-forward"
                size={18}
                color={theme.color.textTertiary}
            />
        </Pressable>
    );

    const renderRestaurantRow = ({ item }: { item: RestaurantSearchItem }) => {
        let name: string;
        let subtitle: string | undefined;
        let handlePress: () => void;

        if (item.type === 'restaurant') {
            const locationProperties = item.data
                .location_properties as LocationProperties;
            name = item.data.name;
            subtitle = locationProperties
                ? `${locationProperties.street?.split(' ').slice(1).join(' ')}, ${locationProperties.city}, ${locationProperties.state}`
                : item.data.address || undefined;
            handlePress = () => handleDbRestaurantPress(item.data);
        } else {
            const { structuredFormat } = item.data.placePrediction;
            name = structuredFormat.mainText.text;
            subtitle = structuredFormat.secondaryText?.text;
            handlePress = () => handleGoogleRestaurantPress(item.data);
        }

        return (
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.resultRow,
                    pressed && { opacity: 0.7 },
                ]}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
            >
                <View style={styles.iconContainer}>
                    <IconSymbol
                        name="restaurant"
                        size={20}
                        color={theme.color.accent}
                    />
                </View>
                <View style={styles.resultTextContainer}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                        {name}
                    </ThemedText>
                    {subtitle && (
                        <ThemedText
                            style={styles.resultSubtitle}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </ThemedText>
                    )}
                </View>
                <IconSymbol
                    name="chevron-forward"
                    size={18}
                    color={theme.color.textTertiary}
                />
            </Pressable>
        );
    };

    const renderFoodItemRow = ({
        item,
    }: {
        item: RestaurantDishSearchResult;
    }) => {
        const hasPhoto = item.photos && item.photos.length > 0;
        const photoUrl = hasPhoto ? item.photos[0] : null;

        return (
            <Pressable
                onPress={() => handleFoodItemPress(item)}
                style={({ pressed }) => [
                    styles.resultRow,
                    pressed && { opacity: 0.7 },
                ]}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
            >
                {photoUrl ? (
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.foodItemPhoto}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={styles.emojiContainer}>
                        <DishTypeIcon
                            icon={item.dish_type_icon}
                            emoji={item.dish_type_emoji}
                            size={20}
                        />
                    </View>
                )}
                <View style={styles.resultTextContainer}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                        {item.dish_type_name}
                    </ThemedText>
                    <ThemedText style={styles.resultSubtitle} numberOfLines={1}>
                        @{item.restaurant_name}
                    </ThemedText>
                </View>
                <IconSymbol
                    name="chevron-forward"
                    size={18}
                    color={theme.color.textTertiary}
                />
            </Pressable>
        );
    };

    // ── Tab content ─────────────────────────────────────────────────────

    const renderTabContent = () => {
        if (error) {
            return (
                <EmptyState
                    icon="alert-circle-outline"
                    title="Search failed"
                    message={error || 'Please try again'}
                />
            );
        }

        if (query.length === 0) {
            return (
                <EmptyState
                    icon="search-outline"
                    title="Search for dishes and restaurants"
                    message="Find your favorite dishes, restaurants, or food items"
                />
            );
        }

        if (query.length < 2) {
            return (
                <View style={styles.hintContainer}>
                    <ThemedText style={styles.hintText}>
                        Type at least 2 characters to search
                    </ThemedText>
                </View>
            );
        }

        if (!isLoading && !hasResults) {
            return (
                <EmptyState
                    icon="search-outline"
                    title={`No results for "${query}"`}
                    message="Try adjusting your search or browse top dishes"
                    actionLabel="Browse Dishes"
                    onActionPress={() => router.back()}
                />
            );
        }

        if (activeTab === 'dishes') {
            if (!isLoading && dishTabItems.length === 0) {
                return (
                    <EmptyState
                        icon="search-outline"
                        title="No dishes found"
                        message={`Try the "Restaurants" tab`}
                    />
                );
            }
            return (
                <FlatList
                    data={dishTabItems}
                    keyExtractor={(item) =>
                        item.type === 'dish-type'
                            ? item.data.id
                            : item.data.restaurant_dish_id
                    }
                    renderItem={({ item }) =>
                        item.type === 'dish-type'
                            ? renderDishTypeRow({ item: item.data })
                            : renderFoodItemRow({ item: item.data })
                    }
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            );
        }

        // restaurants tab
        if (!isLoading && restaurants.length === 0) {
            return (
                <EmptyState
                    icon="search-outline"
                    title="No restaurants found"
                    message={`Try the "Dishes" tab`}
                />
            );
        }
        return (
            <FlatList
                data={restaurants}
                keyExtractor={(item) =>
                    item.type === 'restaurant'
                        ? `db-${item.data.id}`
                        : `google-${item.data.placePrediction.placeId}`
                }
                renderItem={renderRestaurantRow}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        );
    };

    // ── Main render ─────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 20,
                            borderless: true,
                        }}
                    >
                        <IconSymbol
                            name="arrow-back"
                            size={24}
                            color={theme.color.textPrimary}
                        />
                    </Pressable>

                    <View style={styles.searchInputContainer}>
                        <SearchInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search dishes and restaurants..."
                            isLoading={isLoading}
                            autoFocus={true}
                        />
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                style={({ pressed }) => [
                                    styles.tab,
                                    isActive && styles.tabActive,
                                    pressed && { opacity: 0.7 },
                                ]}
                                android_ripple={{
                                    color: theme.color.accent + '20',
                                }}
                            >
                                <ThemedText
                                    style={[
                                        styles.tabLabel,
                                        isActive && styles.tabLabelActive,
                                    ]}
                                >
                                    {tab.label}
                                </ThemedText>
                                {showCounts && tab.count > 0 && (
                                    <View
                                        style={[
                                            styles.tabBadge,
                                            isActive && styles.tabBadgeActive,
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.tabBadgeText,
                                                isActive &&
                                                    styles.tabBadgeTextActive,
                                            ]}
                                        >
                                            {tab.count}
                                        </ThemedText>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                {/* Tab Content */}
                {renderTabContent()}
            </ThemedView>
        </SafeAreaView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
        },
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.border,
        },
        backButton: {
            marginRight: theme.space.sm,
            padding: theme.space.xxs,
        },
        searchInputContainer: {
            flex: 1,
        },
        // Tab bar
        tabBar: {
            flexDirection: 'row',
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.border,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.xs,
            gap: theme.space.xxs,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        tabActive: {
            borderBottomColor: theme.color.accent,
        },
        tabLabel: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.medium,
            color: theme.color.textTertiary,
        },
        tabLabelActive: {
            color: theme.color.accent,
            fontWeight: theme.font.weight.semibold,
        },
        tabBadge: {
            backgroundColor: theme.color.surface2,
            borderRadius: theme.radius.pill,
            paddingHorizontal: 6,
            paddingVertical: 1,
            minWidth: 20,
            alignItems: 'center',
        },
        tabBadgeActive: {
            backgroundColor: theme.color.accent + '20',
        },
        tabBadgeText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.medium,
            color: theme.color.textTertiary,
        },
        tabBadgeTextActive: {
            color: theme.color.accent,
        },
        // List
        listContent: {
            paddingBottom: theme.space.xxl,
        },
        resultRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.sm + 2,
            paddingHorizontal: theme.space.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
            gap: theme.space.sm,
        },
        emojiContainer: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface2 + '40',
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.accent + '15',
            alignItems: 'center',
            justifyContent: 'center',
        },
        foodItemPhoto: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface2,
        },
        resultTextContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        resultTitle: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.semibold,
            color: theme.color.textPrimary,
        },
        resultSubtitle: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 1,
        },
        emptyContainer: {
            flex: 1,
            paddingHorizontal: theme.space.md,
        },
        hintContainer: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.xxl,
            alignItems: 'center',
        },
        hintText: {
            fontSize: theme.font.size.sm,
            opacity: theme.opacity.pressed - 0.1,
            textAlign: 'center',
        },
    });
