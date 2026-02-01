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
import { useCallback, useEffect, useMemo, useState } from 'react';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type SearchResultItem =
    | { type: 'restaurant'; data: RestaurantWithDistance }
    | { type: 'google'; data: GooglePlaceSuggestion };

export function useVenueSearch() {
    const { currentCity, currentLocation } = useLocationStore();
    const { setSelectedRestaurant } = useRatingStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelecting, setIsSelecting] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const location = currentLocation?.coords || null;

    // Google Places address search (has internal 300ms debounce)
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

    // Sync raw query to address search (it debounces internally)
    useEffect(() => {
        setAddressQuery(searchQuery);
    }, [searchQuery, setAddressQuery]);

    // Nearby restaurants (preloaded)
    const { data: nearbyRestaurants = [] } = useNearbyRestaurants(
        location?.latitude || null,
        location?.longitude || null
    );

    // DB search by name (debounced)
    const { data: searchResults = [], isFetching: isSearchingRestaurants } =
        useSearchRestaurants(debouncedSearchQuery);

    const { mutateAsync: createRestaurant, isPending: isCreating } =
        useCreateRestaurant();

    // Merge nearby vs search results
    const restaurantsWithDistance: RestaurantWithDistance[] = useMemo(() => {
        if (!searchQuery && searchResults.length === 0)
            return nearbyRestaurants;
        if (!searchResults) return [];
        return searchResults.map((restaurant) => ({
            ...restaurant,
            distance_meters: undefined,
        }));
    }, [searchResults, nearbyRestaurants, searchQuery]);

    // Combine DB + Google results with deduplication
    const combinedResults: SearchResultItem[] = useMemo(() => {
        const restaurants: SearchResultItem[] = restaurantsWithDistance.map(
            (r) => ({
                type: 'restaurant' as const,
                data: r,
            })
        );

        // Collect google_place_ids from DB restaurants to deduplicate
        const dbGooglePlaceIds = new Set<string>();
        for (const r of restaurantsWithDistance) {
            if (r.google_place_id) {
                dbGooglePlaceIds.add(r.google_place_id);
            }
        }
        for (const r of nearbyRestaurants) {
            if (r.google_place_id) {
                dbGooglePlaceIds.add(r.google_place_id);
            }
        }

        // Filter out Google suggestions that already exist in DB
        const dedupedAddresses: SearchResultItem[] = addressSuggestions
            .filter((s) => !dbGooglePlaceIds.has(s.placePrediction.placeId))
            .map((s) => ({
                type: 'google' as const,
                data: s,
            }));

        return [...restaurants, ...dedupedAddresses];
    }, [restaurantsWithDistance, addressSuggestions, nearbyRestaurants]);

    const selectRestaurant = useCallback(
        (restaurant: Restaurant): Restaurant => {
            setSelectedRestaurant(restaurant);
            return restaurant;
        },
        [setSelectedRestaurant]
    );

    const selectGooglePlace = useCallback(
        async (suggestion: GooglePlaceSuggestion): Promise<Restaurant> => {
            if (isSelecting || isCreating) {
                throw new Error('Selection already in progress');
            }

            setIsSelecting(true);
            try {
                const placeId = suggestion.placePrediction.placeId;
                const addressData = await selectAddress(placeId);

                if (!addressData) {
                    throw new Error('Could not retrieve restaurant details');
                }

                const newRestaurant = await createRestaurant({
                    name: addressData.name,
                    address: `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zip}`,
                    city_id: currentCity?.id,
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                    google_place_id: addressData.google_place_id,
                });

                if (!newRestaurant) {
                    throw new Error('Failed to create restaurant');
                }

                setSelectedRestaurant(newRestaurant);
                return newRestaurant;
            } finally {
                setIsSelecting(false);
            }
        },
        [
            isSelecting,
            isCreating,
            selectAddress,
            createRestaurant,
            currentCity?.id,
            setSelectedRestaurant,
        ]
    );

    const isSearching = isSearchingRestaurants || isSearchingAddress;
    const hasEmptyResults =
        searchQuery.length > 0 && !isSearching && combinedResults.length === 0;

    return {
        searchQuery,
        setSearchQuery,
        combinedResults,
        nearbyRestaurants,
        isSearching,
        isSelecting: isSelecting || isCreating,
        selectRestaurant,
        selectGooglePlace,
        hasEmptyResults,
    };
}
