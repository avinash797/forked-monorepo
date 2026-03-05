import { supabase } from '@/lib/supabase';
import { DishType } from '@/types/dishes';
import { Restaurant } from '@/types/restaurant';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/** Shape returned by the search_restaurant_dishes RPC */
export interface RestaurantDishSearchResult {
    restaurant_dish_id: string;
    dish_type_id: string;
    dish_type_name: string;
    dish_type_emoji: string | null;
    restaurant_id: string;
    restaurant_name: string;
    photos: string[];
    total_ratings: number;
}

/** Combined search results across all three categories */
export interface SearchResults {
    dishTypes: DishType[];
    restaurants: Restaurant[];
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
 * Uses Supabase RPC functions with pg_trgm fuzzy matching
 * Used in: Search screen
 */
export function useSearch(query: string) {
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 350);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    return useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async (): Promise<SearchResults> => {
            if (debouncedQuery.length < 2) {
                return EMPTY_RESULTS;
            }

            const [dishTypesResult, restaurantsResult, restaurantDishesResult] =
                await Promise.all([
                    supabase.rpc('search_dish_types', {
                        search_term: debouncedQuery,
                    }),
                    supabase.rpc('search_restaurants', {
                        search_term: debouncedQuery,
                    }),
                    supabase.rpc('search_restaurant_dishes', {
                        search_term: debouncedQuery,
                    }),
                ]);

            if (dishTypesResult.error) throw dishTypesResult.error;
            if (restaurantsResult.error) throw restaurantsResult.error;
            if (restaurantDishesResult.error)
                throw restaurantDishesResult.error;

            return {
                dishTypes: (dishTypesResult.data ?? []) as DishType[],
                restaurants: (restaurantsResult.data ?? []) as Restaurant[],
                restaurantDishes: dedupeByRestaurant(
                    (restaurantDishesResult.data ?? []) as RestaurantDishSearchResult[]
                ),
            };
        },
        enabled: debouncedQuery.length >= 2,
        placeholderData: (previousData) => previousData,
    });
}
