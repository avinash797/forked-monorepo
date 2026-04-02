import {
    GooglePlaceSuggestion,
    useNearbyGooglePlaces,
    usePlacesSearch,
} from '@/hooks/use-address-search';
import { useDebounce } from '@/hooks/use-debounce';
import {
    RestaurantWithDistance,
    useNearbyRestaurants,
    useSearchRestaurants,
} from '@/hooks/use-restaurants';
import { supabase } from '@/lib/supabase';
import { useRatingStore } from '@/stores';
import { useLocationStore } from '@/stores/location.store';
import { Database } from '@/types/database.types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type SearchResultItem =
    | { type: 'restaurant'; data: RestaurantWithDistance }
    | { type: 'google'; data: GooglePlaceSuggestion };

export function useVenueSearch() {
    const { currentLocation } = useLocationStore();
    const { setSelectedRestaurant, setNewCityInfo } = useRatingStore();
    const queryClient = useQueryClient();
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
    } = usePlacesSearch({
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

    // Combine DB + Google results with deduplication
    // Idle: DB nearby + Google nearby (deduped), DB first
    // Searching: DB search + Google autocomplete (deduped), DB first
    const combinedResults: SearchResultItem[] = useMemo(() => {
        const dbResults = searchQuery ? searchResults : nearbyRestaurants;
        const googleSuggestions = searchQuery
            ? addressSuggestions
            : nearbyGooglePlaces;

        const restaurants: SearchResultItem[] = dbResults.map((r: any) => ({
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
        async (
            suggestion: GooglePlaceSuggestion
        ): Promise<{ restaurant: Restaurant; isNewCity: boolean }> => {
            if (isSelecting) {
                throw new Error('Selection already in progress');
            }

            setIsSelecting(true);
            try {
                const placeId = suggestion.placePrediction.placeId;
                const addressData = await selectAddress(placeId);

                if (!addressData) {
                    throw new Error('Could not retrieve restaurant details');
                }

                // Use RPC to atomically finding/creating City, Neighborhood and Restaurant
                const { data: newRestaurant, error } = await supabase.rpc(
                    'upsert_restaurant_from_google',
                    {
                        p_google_place_id: addressData.google_place_id,
                        p_name: addressData.name,
                        p_address: addressData.full_address,
                        p_city_name: addressData.city,
                        p_state: addressData.state,
                        p_country: addressData.country,
                        p_neighborhood_name:
                            addressData.neighborhood || undefined,
                        p_lat: addressData.latitude,
                        p_lng: addressData.longitude,
                        p_phone: addressData.phone || undefined,
                        p_website: addressData.website || undefined,
                        p_types: addressData.types,
                        p_location_properties: {
                            name: addressData.name,
                            full_address: addressData.full_address,
                            street: addressData.street,
                            city: addressData.city,
                            state: addressData.state,
                            zip: addressData.zip,
                            country: addressData.country,
                            neighborhood: addressData.neighborhood,
                            lat: addressData.latitude,
                            lng: addressData.longitude,
                            phone: addressData.phone,
                            website: addressData.website,
                            types: addressData.types,
                        },
                    }
                );

                if (error) {
                    if (__DEV__) console.error('RPC Error:', error);
                    throw new Error(error.message);
                }

                if (!newRestaurant || !newRestaurant[0]) {
                    throw new Error('Failed to create restaurant');
                }

                const restaurant = newRestaurant[0];
                setSelectedRestaurant(restaurant);

                // Check if this restaurant's city is newly created and needs enrichment
                let isNewCity = false;
                if (restaurant.city_id) {
                    const { data: cityCheck } = await supabase.rpc(
                        'check_city_is_new',
                        { p_city_id: restaurant.city_id }
                    );
                    if (cityCheck?.[0]?.is_new) {
                        isNewCity = true;
                        setNewCityInfo({
                            cityId: restaurant.city_id,
                            cityName: cityCheck[0].city_name,
                            state: cityCheck[0].city_state,
                            country: cityCheck[0].city_country,
                        });
                    }
                }

                // Invalidate restaurant caches so newly created restaurant appears in lists
                queryClient.invalidateQueries({ queryKey: ['restaurants'] });

                return { restaurant, isNewCity };
            } finally {
                setIsSelecting(false);
            }
        },
        [isSelecting, selectAddress, setSelectedRestaurant, setNewCityInfo]
    );

    const isSearching = isSearchingRestaurants || isSearchingAddress;
    const hasEmptyResults =
        searchQuery.length > 0 && !isSearching && combinedResults.length === 0;

    return {
        searchQuery,
        setSearchQuery,
        combinedResults,
        isSearching,
        isSelecting,
        selectRestaurant,
        selectGooglePlace,
        hasEmptyResults,
    };
}
