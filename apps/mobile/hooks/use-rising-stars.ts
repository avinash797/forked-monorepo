import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Rising Star dish - high Bayesian score but low rating count
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
    bayesian_score: number;
    confidence_tier: string;
    raw_weighted_avg: number;
    total_ratings: number;
    featured_photo_url: string | null;
}

/**
 * Hook to fetch "Rising Star" dishes - high Bayesian scores but low rating counts.
 * These are potentially great "Hole in the Wall" discoveries.
 *
 * Criteria:
 * - High bayesian_score (≥ 7.5)
 * - Low total_ratings (< 10)
 * - At least 2 ratings to avoid single-rating flukes
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
                    bayesian_score,
                    confidence_tier,
                    raw_weighted_avg,
                    total_ratings,
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
                .gte('bayesian_score', 7.5)
                .lt('total_ratings', 10)
                .gte('total_ratings', 2)
                .order('bayesian_score', { ascending: false })
                .limit(limit);

            if (cityId) {
                query = query.eq('city_id', cityId);
            }

            if (dishTypeId) {
                query = query.eq('dish_type_id', dishTypeId);
            }

            const { data, error } = await query;

            if (error) throw error;

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
                bayesian_score: (item as any).bayesian_score || 5.0,
                confidence_tier: (item as any).confidence_tier || 'low',
                raw_weighted_avg: (item as any).raw_weighted_avg || 0,
                total_ratings: item.total_ratings || 0,
                featured_photo_url: item.featured_photo_url,
            }));

            return risingStars;
        },
        enabled: !!cityId && !!dishTypeId,
        staleTime: 5 * 60 * 1000,
    });
}
