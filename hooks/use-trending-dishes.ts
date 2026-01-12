import { supabase } from '@/lib/supabase';
import type {
    TrendDirection,
    TrendingDish,
    TrendingDishesFilters,
} from '@/types/browse';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook to fetch truly trending dishes (rising ratings, high activity)
 * Uses the get_trending_dishes PostgreSQL function for efficient querying
 *
 * Unlike useTopDishes which sorts by average_rating, this hook:
 * - Fetches dishes that are actually gaining momentum
 * - Uses trend_score which combines rating change + review velocity
 * - Supports filtering by trend direction ('rising', 'falling', 'stable', 'all')
 *
 * Used in: TrendingSection component, Explore tab
 *
 * @example
 * ```tsx
 * const { dishes, isLoading, error, hasMore, loadMore, refetch } = useTrendingDishes({
 *   city: 'New Orleans',
 *   direction: 'rising',
 *   limit: 10,
 * });
 * ```
 */
export function useTrendingDishes(filters: TrendingDishesFilters = {}) {
    const limit = filters.limit || 20;
    const direction = filters.direction || 'rising';

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isPending,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['trending-dishes', filters],
        queryFn: async ({ pageParam = 0 }) => {
            // Use the PostgreSQL function for efficient querying
            // Note: Type assertion needed until database types are regenerated after migration
            const { data: rpcData, error: queryError } = await supabase.rpc(
                'get_trending_dishes',
                {
                    p_city: filters.city || null,
                    p_direction: direction,
                    p_limit: limit,
                    p_offset: pageParam,
                }
            );

            if (queryError) throw queryError;

            // Transform RPC result to match TrendingDish interface
            const dishes = ((rpcData as any[]) || []).map((row: any) => ({
                // Core dish properties
                id: row.dish_id,
                name: row.dish_name,
                category: row.dish_category,
                variety: row.dish_variety,
                average_rating: row.average_rating,
                review_count: row.review_count,
                current_price: row.current_price,
                currency: row.currency,
                photos: row.photos || [],
                venue_id: row.venue_id,
                is_available: true,

                // Trending properties
                trend_direction: row.trend_direction as TrendDirection,
                trend_score: row.trend_score,
                rating_change_7d: row.rating_change_7d,
                rating_change_30d: row.rating_change_30d,
                review_velocity_7d: row.review_velocity_7d,

                // Venue information
                venue: {
                    id: row.venue_id,
                    name: row.venue_name,
                    address_city: row.venue_city,
                    address_state: row.venue_state,
                },
            })) as TrendingDish[];

            return dishes;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < limit) return undefined;
            return allPages.length * limit;
        },
    });

    const dishes = useMemo(() => data?.pages.flat() || [], [data]);

    return {
        /** Array of trending dishes with trend data */
        dishes,
        /** Loading state (initial load or fetching more) */
        isLoading: isPending || isFetchingNextPage,
        /** Error message if query failed */
        error: error ? (error as Error).message : null,
        /** Whether more dishes can be loaded */
        hasMore: hasNextPage,
        /** Function to load next page of dishes */
        loadMore: () => {
            if (!isFetchingNextPage && hasNextPage) {
                fetchNextPage();
            }
        },
        /** Function to manually refetch data */
        refetch,
    };
}
