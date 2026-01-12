import { supabase } from '@/lib/supabase';
import type { RatingHistoryPoint } from '@/types/browse';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch historical rating data for a dish
 *
 * Returns daily snapshots of the dish's rating over time,
 * useful for displaying rating trend charts on dish detail pages.
 *
 * Note: Charts are deferred to a future iteration, but this hook
 * provides the data needed when charts are implemented.
 *
 * Used in: Dish detail screen (future chart component)
 *
 * @param dishId - The UUID of the dish to fetch history for
 * @param days - Number of days of history to fetch (default: 30)
 *
 * @example
 * ```tsx
 * const { data: history, isLoading, error } = useDishRatingHistory(dishId, 30);
 *
 * // Future: Pass to chart component
 * <RatingHistoryChart data={history} />
 * ```
 */
export function useDishRatingHistory(dishId: string | null, days: number = 30) {
    return useQuery({
        queryKey: ['dish-rating-history', dishId, days],
        queryFn: async (): Promise<RatingHistoryPoint[]> => {
            if (!dishId) throw new Error('No dish ID provided');

            // Note: Type assertion needed until database types are regenerated after migration
            const { data: rpcData, error } = await supabase.rpc(
                'get_dish_rating_history',
                {
                    p_dish_id: dishId,
                    p_days: days,
                }
            );

            if (error) throw error;

            // Transform to frontend-friendly format with camelCase keys
            return (rpcData || []).map((row: any) => ({
                date: row.snapshot_date,
                rating: row.average_rating,
                reviewCount: row.review_count,
                ratingChange7d: row.rating_change_7d,
                reviewVelocity7d: row.review_velocity_7d,
            }));
        },
        enabled: !!dishId,
        // History doesn't change often, cache for 5 minutes
        staleTime: 1000 * 60 * 5,
    });
}
