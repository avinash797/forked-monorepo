import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Top dish data structure (from leaderboard)
 */
export interface TopDishData {
    rank: number;
    restaurant_id: string;
    restaurant_name: string;
    neighborhood_name: string | null;
    global_elo: number;
    total_battles: number;
    win_rate: number;
    confidence_score: number;
    avg_raw_score: number;
    total_ratings: number;
    featured_photo_url: string | null;
}

/**
 * Rising star dish data structure
 */
export interface RisingStarData {
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
 * Dish type with associated hero and rising star data
 */
export interface DishTypeWithData {
    id: string;
    name: string;
    emoji: string | null;
    topDish: TopDishData | null;
    risingStar: RisingStarData | null;
}

/**
 * Hook to fetch all discover screen data in batch
 *
 * This hook fetches:
 * 1. All active dish types
 * 2. Top dish (hero) for each dish type
 * 3. Rising star for each dish type
 *
 * Data is fetched in 2 batch queries instead of N+1 individual queries.
 *
 * @param cityId - The city to fetch data for
 * @returns Object containing dish types with their associated data
 */
export function useDiscoverData(cityId: string | undefined) {
    return useQuery({
        queryKey: ['discover-data', cityId],
        queryFn: async () => {
            if (!cityId) {
                return { dishTypes: [], heroMap: {}, risingStarMap: {} };
            }

            // Fetch all data in parallel
            const [dishTypesResult, heroesResult, risingStarsResult] =
                await Promise.all([
                    // 1. Fetch dish types
                    supabase
                        .from('dish_types')
                        .select('id, name, emoji')
                        .eq('is_active', true)
                        .order('launch_order', { ascending: true }),

                    // 2. Fetch top dish for each dish type (batch via RPC or view)
                    // Using global_dish_scores to get top by confidence
                    supabase
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
                            restaurant:restaurants(id, name),
                            neighborhood:neighborhoods(id, name)
                        `
                        )
                        .eq('city_id', cityId)
                        .gte('total_battles', 5) // Minimum battles for hero
                        .order('confidence_score', { ascending: false }),

                    // 3. Fetch rising stars (high score, low battles)
                    supabase
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
                            restaurant:restaurants(id, name),
                            dish_type:dish_types(id, name, emoji),
                            neighborhood:neighborhoods(id, name)
                        `
                        )
                        .eq('city_id', cityId)
                        .gte('avg_raw_score', 7.5)
                        .lt('total_battles', 10)
                        .gte('total_ratings', 2)
                        .order('avg_raw_score', { ascending: false }),
                ]);

            if (dishTypesResult.error) throw dishTypesResult.error;
            if (heroesResult.error) throw heroesResult.error;
            if (risingStarsResult.error) throw risingStarsResult.error;

            const dishTypes = dishTypesResult.data || [];
            const heroes = heroesResult.data || [];
            const risingStars = risingStarsResult.data || [];

            // Build hero map: dish_type_id -> top dish (first one per type)
            const heroMap: Record<string, TopDishData> = {};
            for (const hero of heroes) {
                if (!heroMap[hero.dish_type_id]) {
                    heroMap[hero.dish_type_id] = {
                        rank: 1,
                        restaurant_id: hero.restaurant_id,
                        restaurant_name:
                            (hero.restaurant as any)?.name || 'Unknown',
                        neighborhood_name:
                            (hero.neighborhood as any)?.name || null,
                        global_elo: hero.global_elo || 1500,
                        total_battles: hero.total_battles || 0,
                        win_rate: 0,
                        confidence_score: hero.confidence_score || 0,
                        avg_raw_score: hero.avg_raw_score || 0,
                        total_ratings: hero.total_ratings || 0,
                        featured_photo_url: hero.featured_photo_url,
                    };
                }
            }

            // Build rising star map: dish_type_id -> rising star (first one per type)
            const risingStarMap: Record<string, RisingStarData> = {};
            for (const star of risingStars) {
                if (!risingStarMap[star.dish_type_id]) {
                    risingStarMap[star.dish_type_id] = {
                        id: star.id,
                        restaurant_id: star.restaurant_id,
                        restaurant_name:
                            (star.restaurant as any)?.name || 'Unknown',
                        dish_type_id: star.dish_type_id,
                        dish_type_name: (star.dish_type as any)?.name || 'Dish',
                        dish_type_emoji: (star.dish_type as any)?.emoji || '🍽️',
                        city_id: star.city_id,
                        neighborhood_id: star.neighborhood_id,
                        neighborhood_name:
                            (star.neighborhood as any)?.name || null,
                        avg_raw_score: star.avg_raw_score || 0,
                        total_ratings: star.total_ratings || 0,
                        total_battles: star.total_battles || 0,
                        global_elo: star.global_elo || 1500,
                        confidence_score: star.confidence_score || 0,
                        featured_photo_url: star.featured_photo_url,
                    };
                }
            }

            // Combine into dish types with data
            const dishTypesWithData: DishTypeWithData[] = dishTypes.map(
                (dt) => ({
                    id: dt.id,
                    name: dt.name,
                    emoji: dt.emoji,
                    topDish: heroMap[dt.id] || null,
                    risingStar: risingStarMap[dt.id] || null,
                })
            );

            return {
                dishTypes: dishTypesWithData,
                // Also expose maps for direct access if needed
                heroMap,
                risingStarMap,
            };
        },
        enabled: !!cityId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
