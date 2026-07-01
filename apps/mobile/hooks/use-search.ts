import {
    GooglePlaceSuggestion,
    usePlacesSearch,
} from '@/hooks/use-address-search';
import {
    RestaurantWithDistance,
    useSearchRestaurants,
} from '@/hooks/use-restaurants';
import { supabase } from '@/lib/supabase';
import { useLocationStore } from '@/stores/location.store';
import { DishType } from '@forked/types/dishes';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

/** Shape returned by the search_restaurant_dishes RPC */
export interface RestaurantDishSearchResult {
    restaurant_dish_id: string;
    dish_type_id: string;
    dish_type_name: string;
    dish_type_emoji: string | null;
    dish_type_icon?: string | null;
    restaurant_id: string;
    restaurant_name: string;
    photos: string[];
    total_ratings: number;
}

export type RestaurantSearchItem =
    | { type: 'restaurant'; data: RestaurantWithDistance }
    | { type: 'google'; data: GooglePlaceSuggestion };

/** Combined search results across all three categories */
export interface SearchResults {
    dishTypes: DishType[];
    restaurants: RestaurantSearchItem[];
    restaurantDishes: RestaurantDishSearchResult[];
}

const EMPTY_RESULTS: SearchResults = {
    dishTypes: [],
    restaurants: [],
    restaurantDishes: [],
};

/** Keeps only the first result per restaurant+dish_type combo */
function dedupeByRestaurant(
    items: RestaurantDishSearchResult[]
): RestaurantDishSearchResult[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = `${item.restaurant_id}:${item.dish_type_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Hook to cross-search restaurants, dish types, and restaurant dishes
 * Uses Supabase RPC for dishes + Google Places for restaurants
 * Used in: Search screen
 */
export function useSearch(query: string) {
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const { currentLocation } = useLocationStore();
    const location = currentLocation?.coords || null;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 350);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    // Google Places search for restaurants (has internal 300ms debounce)
    const {
        suggestions: placeSuggestions,
        setQuery: setPlacesQuery,
        loading: isSearchingPlaces,
        selectAddress,
    } = usePlacesSearch({
        proximity: location
            ? { latitude: location.latitude, longitude: location.longitude }
            : null,
    });

    // Sync query to Google Places search
    useEffect(() => {
        setPlacesQuery(query);
    }, [query, setPlacesQuery]);

    // DB restaurant search by name (debounced)
    const { data: dbRestaurants = [], isFetching: isSearchingDbRestaurants } =
        useSearchRestaurants(debouncedQuery);

    // Combine DB + Google results with deduplication (DB first, then Google minus dupes)
    const combinedRestaurants: RestaurantSearchItem[] = useMemo(() => {
        const restaurants: RestaurantSearchItem[] = dbRestaurants.map((r) => ({
            type: 'restaurant' as const,
            data: r as RestaurantWithDistance,
        }));

        const dbGooglePlaceIds = new Set<string>();
        for (const r of dbRestaurants) {
            if (r.google_place_id) {
                dbGooglePlaceIds.add(r.google_place_id);
            }
        }

        const dedupedGoogle: RestaurantSearchItem[] = placeSuggestions
            .filter((s) => !dbGooglePlaceIds.has(s.placePrediction.placeId))
            .map((s) => ({
                type: 'google' as const,
                data: s,
            }));

        return [...restaurants, ...dedupedGoogle];
    }, [dbRestaurants, placeSuggestions]);

    // Supabase RPC search for dish types and restaurant dishes
    const dishQuery = useQuery({
        queryKey: ['search-dishes', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 2) {
                return {
                    dishTypes: [] as DishType[],
                    restaurantDishes: [] as RestaurantDishSearchResult[],
                };
            }

            const [dishTypesResult, restaurantDishesResult] = await Promise.all(
                [
                    supabase.rpc('search_dish_types', {
                        search_term: debouncedQuery,
                    }),
                    supabase.rpc('search_restaurant_dishes', {
                        search_term: debouncedQuery,
                    }),
                ]
            );

            if (dishTypesResult.error) throw dishTypesResult.error;
            if (restaurantDishesResult.error)
                throw restaurantDishesResult.error;

            return {
                dishTypes: (dishTypesResult.data ?? []) as DishType[],
                restaurantDishes: dedupeByRestaurant(
                    (restaurantDishesResult.data ??
                        []) as RestaurantDishSearchResult[]
                ),
            };
        },
        enabled: debouncedQuery.length >= 2,
        placeholderData: (previousData) => previousData,
    });

    // Combine into a single shape that matches the original return type
    const data: SearchResults | undefined = dishQuery.data
        ? {
              dishTypes: dishQuery.data.dishTypes,
              restaurants: combinedRestaurants,
              restaurantDishes: dishQuery.data.restaurantDishes,
          }
        : debouncedQuery.length >= 2
          ? undefined
          : { ...EMPTY_RESULTS, restaurants: combinedRestaurants };

    return {
        data,
        isFetching:
            dishQuery.isFetching ||
            isSearchingPlaces ||
            isSearchingDbRestaurants,
        error: dishQuery.error,
        selectAddress,
    };
}
