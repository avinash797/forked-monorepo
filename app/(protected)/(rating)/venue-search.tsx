import { SearchInput } from '@/components/rating/search-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    GooglePlaceSuggestion,
    useAddressSearch,
} from '@/hooks/use-address-search';
import { useDebounce } from '@/hooks/use-debounce';
import {
    RestaurantWithDistance,
    useCreateRestaurant,
    useNearbyRestaurants,
    useSearchRestaurants,
} from '@/hooks/use-restaurants';
import { useRatingStore } from '@/stores';
import { useLocationStore } from '@/stores/location.store';
import { Database } from '@/types/database.types';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type SearchResultItem =
    | { type: 'restaurant'; data: RestaurantWithDistance }
    | { type: 'google'; data: GooglePlaceSuggestion };

export default function VenueSearchScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { setSelectedRestaurant } = useRatingStore();
    const { currentCity, currentLocation } = useLocationStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelecting, setIsSelecting] = useState(false);

    // Debounce search query to prevent rapid API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const location = currentLocation?.coords || null;

    // Address Search
    // Note: useAddressSearch has internal debouncing for the query it executes,
    // but we pass the raw query to it to keep the input responsive.
    const {
        suggestions: addressSuggestions,
        setQuery: setAddressQuery,
        loading: isSearchingAddress,
        selectAddress,
    } = useAddressSearch({
        proximity: location
            ? { latitude: location.latitude, longitude: location.longitude }
            : null,
    });

    // Sync search query with address search
    useEffect(() => {
        setAddressQuery(searchQuery);
    }, [searchQuery, setAddressQuery]);

    // Preload Nearby Restaurants
    const { data: nearbyRestaurants = [] } = useNearbyRestaurants(
        location?.latitude || null,
        location?.longitude || null
    );

    // Search restaurants by name (using debounced query)
    const { data: searchResults = [], isFetching: isSearchingRestaurants } =
        useSearchRestaurants(debouncedSearchQuery);

    const { mutateAsync: createRestaurant, isPending: isCreating } =
        useCreateRestaurant();

    const iconColor = theme.color.textTertiary;

    // Combined loading state
    const isSearching = isSearchingRestaurants || isSearchingAddress;

    // Process restaurant results
    const restaurantsWithDistance: RestaurantWithDistance[] = useMemo(() => {
        if (!searchQuery && searchResults.length === 0)
            return nearbyRestaurants;
        if (!searchResults) return [];
        return searchResults.map((restaurant) => ({
            ...restaurant,
            distance_meters: undefined, // PostGIS distance not available in simple query
        }));
    }, [searchResults, nearbyRestaurants, searchQuery]);

    const handleRestaurantSelect = useCallback(
        (restaurant: Restaurant) => {
            setSelectedRestaurant(restaurant);
            router.push('/(protected)/(rating)/dish-selection');
        },
        [setSelectedRestaurant, router]
    );

    const handleAddressSelect = async (suggestion: GooglePlaceSuggestion) => {
        if (isSelecting || isCreating) return;

        try {
            setIsSelecting(true);
            const placeId = suggestion.placePrediction.placeId;
            const addressData = await selectAddress(placeId);

            if (!addressData) {
                throw new Error('Could not retrieve restaurant details');
            }

            // Create the restaurant automatically
            const newRestaurant = await createRestaurant({
                name: addressData.name,
                address: `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zip}`,
                city_id: currentCity?.id,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
            });

            if (newRestaurant) {
                setSelectedRestaurant(newRestaurant);
                router.push('/(protected)/(rating)/dish-selection');
            } else {
                throw new Error('Failed to create restaurant');
            }
        } catch (err) {
            Alert.alert(
                'Error',
                'Could not select this restaurant. Please try again.'
            );
        } finally {
            setIsSelecting(false);
        }
    };

    const handleCreateRestaurant = () => {
        router.push('/(protected)/(rating)/create-venue');
    };

    // Memoize combined data to prevent unnecessary re-computations
    const combinedData: SearchResultItem[] = useMemo(() => {
        const restaurants: SearchResultItem[] = restaurantsWithDistance.map(
            (r) => ({
                type: 'restaurant' as const,
                data: r,
            })
        );

        const addresses: SearchResultItem[] = addressSuggestions.map((s) => ({
            type: 'google' as const,
            data: s,
        }));

        return [...restaurants, ...addresses];
    }, [restaurantsWithDistance, addressSuggestions]);

    const renderItem = useCallback(
        ({ item }: { item: SearchResultItem }) => {
            if (item.type === 'restaurant') {
                return (
                    <Pressable
                        style={({ pressed }) => [
                            styles.restaurantItem,
                            pressed && styles.restaurantItemPressed,
                        ]}
                        onPress={() => handleRestaurantSelect(item.data)}
                    >
                        <View style={styles.restaurantContent}>
                            <ThemedText
                                style={styles.restaurantName}
                                numberOfLines={1}
                            >
                                {item.data.name}
                            </ThemedText>
                            {item.data.address && (
                                <ThemedText
                                    style={styles.restaurantAddress}
                                    numberOfLines={1}
                                >
                                    {item.data.address}
                                </ThemedText>
                            )}
                        </View>
                        <IconSymbol
                            name="chevron-forward"
                            size={20}
                            color={iconColor}
                        />
                    </Pressable>
                );
            } else {
                // Google Place Suggestion
                const { structuredFormat } = item.data.placePrediction;
                const mainText = structuredFormat.mainText.text;
                const secondaryText = structuredFormat.secondaryText?.text;

                return (
                    <Pressable
                        style={({ pressed }) => [
                            styles.mapboxItem,
                            pressed && styles.mapboxItemPressed,
                        ]}
                        onPress={() => handleAddressSelect(item.data)}
                    >
                        <View style={styles.mapboxContent}>
                            <ThemedText
                                style={styles.mapboxName}
                                numberOfLines={1}
                            >
                                {mainText}
                            </ThemedText>
                            {secondaryText && (
                                <ThemedText
                                    style={styles.mapboxAddress}
                                    numberOfLines={1}
                                >
                                    {secondaryText}
                                </ThemedText>
                            )}
                            <ThemedText style={styles.mapboxMeta}>
                                Google Place
                            </ThemedText>
                        </View>
                        <IconSymbol
                            name="chevron-forward"
                            size={20}
                            color={iconColor}
                        />
                    </Pressable>
                );
            }
        },
        [styles, iconColor, handleRestaurantSelect, handleAddressSelect]
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Find Restaurant',
                    headerBackTitle: 'Back',
                }}
            />
            <ThemedView style={styles.container}>
                <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search for a restaurant..."
                    isLoading={isSearching || isCreating || isSelecting}
                />

                {!searchQuery && nearbyRestaurants.length > 0 && (
                    <View style={styles.listContent}>
                        <ThemedText style={styles.emptyHint}>
                            Nearby Restaurants
                        </ThemedText>
                    </View>
                )}

                {combinedData.length > 0 && (
                    <FlatList
                        data={combinedData}
                        keyExtractor={(item) =>
                            item.type === 'restaurant'
                                ? `restaurant-${item.data.id}`
                                : `google-${item.data.placePrediction.placeId}`
                        }
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                {/* Show "Can't find?" only if we searched and found nothing */}
                {searchQuery.length > 0 &&
                    !isSearching &&
                    combinedData.length === 0 && (
                        <ThemedView style={styles.emptyState}>
                            <ThemedText style={styles.emptyText}>
                                No results found for "{searchQuery}"
                            </ThemedText>
                            <ThemedButton
                                variant="secondary"
                                onPress={handleCreateRestaurant}
                                style={styles.createButton}
                            >
                                Manually Add Restaurant
                            </ThemedButton>
                        </ThemedView>
                    )}
            </ThemedView>
        </>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: theme.space.md,
            backgroundColor: theme.color.bg,
        },
        listContent: {
            paddingVertical: theme.space.md,
            gap: theme.space.sm,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.xl,
            gap: theme.space.sm,
        },
        emptyText: {
            fontSize: theme.font.size.lg,
            fontWeight: '600',
            color: theme.color.textPrimary,
            textAlign: 'center',
        },
        emptyHint: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            textAlign: 'center',
        },
        createButton: {
            marginTop: theme.space.md,
        },
        restaurantItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.md,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        restaurantItemPressed: {
            backgroundColor: theme.color.surface2,
        },
        restaurantContent: {
            flex: 1,
        },
        restaurantName: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textPrimary,
        },
        restaurantAddress: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        mapboxItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.md,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.accent,
            borderStyle: 'dashed',
        },
        mapboxItemPressed: {
            backgroundColor: theme.color.surface2,
        },
        mapboxIcon: {
            marginRight: theme.space.sm,
        },
        mapboxContent: {
            flex: 1,
        },
        mapboxName: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textPrimary,
        },
        mapboxAddress: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        mapboxMeta: {
            fontSize: theme.font.size.xs,
            color: theme.color.accent,
            fontWeight: '600',
            marginTop: 4,
        },
    });
