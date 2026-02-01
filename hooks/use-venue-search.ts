import {
    GooglePlaceSuggestion,
    useAddressSearch,
    useNearbyGooglePlaces,
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

    // Nearby restaurants from DB (preloaded)
    const { data: nearbyRestaurants = [] } = useNearbyRestaurants(
        location?.latitude || null,
        location?.longitude || null
    );

    // Nearby restaurants from Google (preloaded, supplements DB results)
    const { data: nearbyGooglePlaces = [] } = useNearbyGooglePlaces({
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
    });

    // DB search by name (debounced)
    const { data: searchResults = [], isFetching: isSearchingRestaurants } =
        useSearchRestaurants(debouncedSearchQuery);

    const { mutateAsync: createRestaurant, isPending: isCreating } =
        useCreateRestaurant();

    // Combine DB + Google results with deduplication
    // Idle: DB nearby + Google nearby (deduped), DB first
    // Searching: DB search + Google autocomplete (deduped), DB first
    const combinedResults: SearchResultItem[] = useMemo(() => {
        const dbResults = searchQuery ? searchResults : nearbyRestaurants;
        const googleSuggestions = searchQuery
            ? addressSuggestions
            : nearbyGooglePlaces;

        const restaurants: SearchResultItem[] = dbResults.map((r) => ({
            type: 'restaurant' as const,
            data: r,
        }));

        // Collect google_place_ids from DB results to deduplicate
        const dbGooglePlaceIds = new Set<string>();
        for (const r of dbResults) {
            if (r.google_place_id) {
                dbGooglePlaceIds.add(r.google_place_id);
            }
        }

        // Filter out Google suggestions that already exist in DB
        const dedupedGoogle: SearchResultItem[] = googleSuggestions
            .filter((s) => !dbGooglePlaceIds.has(s.placePrediction.placeId))
            .map((s) => ({
                type: 'google' as const,
                data: s,
            }));

        return [...restaurants, ...dedupedGoogle];
    }, [
        searchResults,
        nearbyRestaurants,
        addressSuggestions,
        nearbyGooglePlaces,
        searchQuery,
    ]);

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
                    address: addressData.full_address,
                    city_id: currentCity?.id,
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                    google_place_id: addressData.google_place_id,
                    phone: addressData.phone,
                    website: addressData.website,
                    types: addressData.types,
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
        isSearching,
        isSelecting: isSelecting || isCreating,
        selectRestaurant,
        selectGooglePlace,
        hasEmptyResults,
    };
}
