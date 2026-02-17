import { EmptyState } from '@/components/browse/empty-state';
import { SectionHeader } from '@/components/browse/section-header';
import { SearchInput } from '@/components/rating/search-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    RestaurantDishSearchResult,
    SearchResults,
    useSearch,
} from '@/hooks/use-search';
import { DishType } from '@/types/dishes';
import { Restaurant } from '@/types/restaurant';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const {
        data: results,
        isFetching: isLoading,
        error: searchError,
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

    const handleRestaurantPress = (restaurant: Restaurant) => {
        router.push({
            pathname: '/(protected)/(browse)/restaurant-detail',
            params: { venueId: restaurant.id },
        });
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

    // ── Empty / hint / error states ─────────────────────────────────────

    const renderEmptyQuery = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="search-outline"
                title="Search for dishes and restaurants"
                message="Find your favorite dishes, restaurants, or food items"
            />
        </View>
    );

    const renderNoResults = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="search-outline"
                title={`No results for "${query}"`}
                message="Try adjusting your search or browse top dishes"
                actionLabel="Browse Dishes"
                onActionPress={() => router.back()}
            />
        </View>
    );

    const renderError = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="alert-circle-outline"
                title="Search failed"
                message={error || 'Please try again'}
            />
        </View>
    );

    // ── Result row components ───────────────────────────────────────────

    const renderDishTypeRow = (dishType: DishType) => (
        <Pressable
            key={dishType.id}
            onPress={() => handleDishTypePress(dishType)}
            style={({ pressed }) => [
                styles.resultRow,
                pressed && { opacity: 0.7 },
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        >
            <View style={styles.emojiContainer}>
                <ThemedText style={styles.emoji}>
                    {dishType.emoji || '🍽️'}
                </ThemedText>
            </View>
            <View style={styles.resultTextContainer}>
                <ThemedText style={styles.resultTitle} numberOfLines={1}>
                    {dishType.name}
                </ThemedText>
            </View>
            <IconSymbol
                name="chevron-forward"
                size={18}
                color={theme.color.textTertiary}
            />
        </Pressable>
    );

    const renderRestaurantRow = (restaurant: Restaurant) => (
        <Pressable
            key={restaurant.id}
            onPress={() => handleRestaurantPress(restaurant)}
            style={({ pressed }) => [
                styles.resultRow,
                pressed && { opacity: 0.7 },
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        >
            <View style={styles.iconContainer}>
                <IconSymbol
                    name="location-sharp"
                    size={20}
                    color={theme.color.accent}
                />
            </View>
            <View style={styles.resultTextContainer}>
                <ThemedText style={styles.resultTitle} numberOfLines={1}>
                    {restaurant.name}
                </ThemedText>
                {restaurant.address && (
                    <ThemedText style={styles.resultSubtitle} numberOfLines={1}>
                        {restaurant.address}
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

    const renderFoodItemRow = (item: RestaurantDishSearchResult) => {
        const hasPhoto = item.photos && item.photos.length > 0;
        const photoUrl = hasPhoto ? item.photos[0] : null;

        return (
            <Pressable
                key={item.restaurant_dish_id}
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
                        <ThemedText style={styles.emoji}>
                            {item.dish_type_emoji || '🍽️'}
                        </ThemedText>
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

    // ── Main render ─────────────────────────────────────────────────────

    const renderContent = () => {
        if (error) return renderError();
        if (query.length === 0) return renderEmptyQuery();
        if (query.length > 0 && query.length < 2) {
            return (
                <View style={styles.hintContainer}>
                    <ThemedText style={styles.hintText}>
                        Type at least 2 characters to search
                    </ThemedText>
                </View>
            );
        }
        if (query.length >= 2 && !isLoading && !hasResults) {
            return renderNoResults();
        }

        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Dish Types Section */}
                {dishTypes.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Dish Types"
                            subtitle={`${dishTypes.length} ${dishTypes.length === 1 ? 'result' : 'results'}`}
                        />
                        <View style={styles.resultsList}>
                            {dishTypes.map(renderDishTypeRow)}
                        </View>
                    </View>
                )}

                {/* Restaurants Section */}
                {restaurants.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Restaurants"
                            subtitle={`${restaurants.length} ${restaurants.length === 1 ? 'result' : 'results'}`}
                        />
                        <View style={styles.resultsList}>
                            {restaurants.map(renderRestaurantRow)}
                        </View>
                    </View>
                )}

                {/* Food Items (Restaurant Dishes) Section */}
                {restaurantDishes.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Food Items"
                            subtitle={`${restaurantDishes.length} ${restaurantDishes.length === 1 ? 'result' : 'results'}`}
                        />
                        <View style={styles.resultsList}>
                            {restaurantDishes.map(renderFoodItemRow)}
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Custom Header with Back Button and Search */}
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

                {renderContent()}
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
        scrollContent: {
            paddingBottom: theme.space.xxl,
        },
        section: {
            marginTop: theme.space.xs,
        },
        resultsList: {
            paddingHorizontal: theme.space.md,
        },
        resultRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.sm + 2,
            paddingHorizontal: theme.space.sm,
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
        emoji: {
            fontSize: 20,
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
            paddingTop: 120,
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
