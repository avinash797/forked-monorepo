import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Rising Star dish - high raw score but low battle count
 */
export interface RisingStarDish {
    id: string;
    restaurant_id: string;
    restaurant_name: string;
    dish_type_id: string;
    dish_type_name: string;
    dish_type_emoji: string;
    city_id: string;
    neighborhood_id: string | null;
    neighborhood_name: string | null;
    avg_raw_score: number;
    total_ratings: number;
    total_battles: number;
    global_elo: number;
    confidence_score: number;
    featured_photo_url: string | null;
}

/**
 * Hook to fetch "Rising Star" dishes - high ratings but low battle counts
 * These are potentially great "Hole in the Wall" discoveries
 *
 * Criteria:
 * - High avg_raw_score (≥ 7.5)
 * - Low total_battles (< 10 battles)
 * - At least 2 ratings to avoid single-rating flukes
 *
 * Used in: RisingStarCard component on Home screen
 *
 * @example
 * ```tsx
 * const { risingStars, isLoading } = useRisingStars({
 *   cityId: 'nola-id',
 *   limit: 5
 * });
 * ```
 */
export function useRisingStars(options: {
    cityId?: string;
    dishTypeId?: string;
    limit?: number;
} = {}) {
    const { cityId, dishTypeId, limit = 5 } = options;

    return useQuery({
        queryKey: ['rising-stars', cityId, dishTypeId, limit],
        queryFn: async () => {
            let query = supabase
                .from('global_dish_scores')
                .select(
                    `
                    id,
                    restaurant_id,
                    dish_type_id,
                    city_id,
                    neighborhood_id,
                    avg_raw_score,
                    total_ratings,
                    total_battles,
                    global_elo,
                    confidence_score,
                    featured_photo_url,
                    restaurant:restaurants(
                        id,
                        name
                    ),
                    dish_type:dish_types(
                        id,
                        name,
                        emoji
                    ),
                    neighborhood:neighborhoods(
                        id,
                        name
                    )
                `
                )
                .gte('avg_raw_score', 7.5) // High raw score
                .lt('total_battles', 10) // Low battle count
                .gte('total_ratings', 2) // At least 2 ratings
                .order('avg_raw_score', { ascending: false })
                .limit(limit);

            // Filter by city if provided
            if (cityId) {
                query = query.eq('city_id', cityId);
            }

            // Filter by dish type if provided
            if (dishTypeId) {
                query = query.eq('dish_type_id', dishTypeId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform to RisingStarDish format
            const risingStars: RisingStarDish[] = (data || []).map((item) => ({
                id: item.id,
                restaurant_id: item.restaurant_id,
                restaurant_name: (item.restaurant as any)?.name || 'Unknown Restaurant',
                dish_type_id: item.dish_type_id,
                dish_type_name: (item.dish_type as any)?.name || 'Dish',
                dish_type_emoji: (item.dish_type as any)?.emoji || '🍽️',
                city_id: item.city_id,
                neighborhood_id: item.neighborhood_id,
                neighborhood_name: (item.neighborhood as any)?.name || null,
                avg_raw_score: item.avg_raw_score || 0,
                total_ratings: item.total_ratings || 0,
                total_battles: item.total_battles || 0,
                global_elo: item.global_elo || 1500,
                confidence_score: item.confidence_score || 0,
                featured_photo_url: item.featured_photo_url,
            }));

            return risingStars;
        },
        // Only fetch when cityId and dishTypeId are provided
        enabled: !!cityId && !!dishTypeId,
        // Refresh every 5 minutes
        staleTime: 5 * 60 * 1000,
    });
}
