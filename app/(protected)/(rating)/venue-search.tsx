import { SearchInput } from '@/components/rating/search-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAddressSearch } from '@/hooks/use-address-search';
import { useLocation } from '@/hooks/use-location';
import {
    useCreateRestaurant,
    useRestaurants,
    RestaurantWithDistance,
} from '@/hooks/use-restaurants';
import { useRatingStore } from '@/stores';
import { useLocationStore } from '@/stores/location.store';
import { Database } from '@/types/database.types';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type SearchResultItem =
    | { type: 'restaurant'; data: RestaurantWithDistance }
    | { type: 'mapbox'; data: any };

export default function VenueSearchScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { setSelectedRestaurant } = useRatingStore();
    const { currentCity } = useLocationStore();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: locationData } = useLocation();
    const location = locationData?.location || null;
    const hasPermission = locationData?.hasPermission || false;

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

    useEffect(() => {
        setAddressQuery(searchQuery);
    }, [searchQuery, setAddressQuery]);

    // Search restaurants by name
    const { data: searchResults = [], isFetching: isSearchingRestaurants } =
        useRestaurants(searchQuery);

    const { mutateAsync: createRestaurant, isPending: isCreating } =
        useCreateRestaurant();

    const iconColor = theme.color.textTertiary;

    const isSearching = isSearchingRestaurants || isSearchingAddress;

    // Add distance calculation to restaurants
    const restaurantsWithDistance: RestaurantWithDistance[] = useMemo(() => {
        if (!searchResults) return [];
        return searchResults.map((restaurant) => ({
            ...restaurant,
            distance_meters: undefined, // PostGIS distance not available in simple query
        }));
    }, [searchResults]);

    const handleRestaurantSelect = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        router.push('/(protected)/(rating)/dish-selection');
    };

    const handleMapboxSelect = async (suggestion: any) => {
        try {
            const addressData = await selectAddress(suggestion.mapbox_id);

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
        }
    };

    const handleCreateRestaurant = () => {
        router.push('/(protected)/(rating)/create-venue');
    };

    const combinedData: SearchResultItem[] = [
        ...restaurantsWithDistance.map((r) => ({
            type: 'restaurant' as const,
            data: r,
        })),
        ...addressSuggestions.map((s) => ({
            type: 'mapbox' as const,
            data: s,
        })),
    ];

    const renderItem = ({ item }: { item: SearchResultItem }) => {
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
            // Mapbox suggestion
            return (
                <Pressable
                    style={({ pressed }) => [
                        styles.mapboxItem,
                        pressed && styles.mapboxItemPressed,
                    ]}
                    onPress={() => handleMapboxSelect(item.data)}
                >
                    <View style={styles.mapboxIcon}>
                        <IconSymbol name="locate" size={24} color={iconColor} />
                    </View>
                    <View style={styles.mapboxContent}>
                        <ThemedText style={styles.mapboxName}>
                            {item.data.name}
                        </ThemedText>
                        <ThemedText style={styles.mapboxAddress}>
                            {item.data.full_address}
                        </ThemedText>
                        <ThemedText style={styles.mapboxMeta}>
                            Add New Restaurant
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
    };

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
                    isLoading={isSearching || isCreating}
                />

                {searchQuery.length === 0 && (
                    <ThemedView style={styles.emptyState}>
                        <IconSymbol
                            name="restaurant"
                            size={48}
                            color={theme.color.textTertiary}
                        />
                        <ThemedText style={styles.emptyText}>
                            Where did you eat?
                        </ThemedText>
                        <ThemedText style={styles.emptyHint}>
                            Search by restaurant name to get started
                        </ThemedText>
                    </ThemedView>
                )}

                {combinedData.length > 0 && (
                    <FlatList
                        data={combinedData}
                        keyExtractor={(item) =>
                            item.type === 'restaurant'
                                ? item.data.id
                                : item.data.mapbox_id
                        }
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
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
