import { useAuth } from '@/hooks/use-auth';
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
    bayesian_score: number;
    confidence_tier: string;
    raw_weighted_avg: number;
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
    dish_type_icon?: string | null;
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
 * Dish type with associated hero and rising star data
 */
export interface DishTypeWithData {
    id: string;
    name: string;
    emoji: string | null;
    icon: string | null;

    topDish: TopDishData | null;
    risingStar: RisingStarData | null;
}

/**
 * Location filter configuration for discover data queries.
 *
 * - cityId: filter by city UUID
 * - nearby: filter by user lat/long within a radius
 * - If neither is provided, all restaurants are returned.
 */
export interface DiscoverLocationFilter {
    cityId?: string;
    nearby?: {
        latitude: number;
        longitude: number;
        radiusMeters: number;
    };
}

/**
 * Hook to fetch all discover screen data in batch
 *
 * This hook fetches:
 * 1. All active dish types
 * 2. Top dish (hero) for each dish type (excluding restaurants user has rated)
 * 3. Rising star for each dish type (excluding restaurants user has rated)
 *
 * Data is fetched in 3 batch queries instead of N+1 individual queries.
 * Uses RPC functions to exclude restaurants where the user has already rated dishes.
 *
 * Supports two location filtering modes:
 * - City ID: filters restaurants by city UUID
 * - Nearby: filters restaurants within a radius of user coordinates
 *
 * @param locationFilter - Location filter configuration
 * @returns Object containing dish types with their associated data
 */
export function useDiscoverData(locationFilter: DiscoverLocationFilter) {
    const { user } = useAuth();

    return useQuery({
        // Include user ID and filter params in query key for proper cache invalidation
        queryKey: [
            'discover-data',
            locationFilter.cityId ?? null,
            locationFilter.nearby?.latitude ?? null,
            locationFilter.nearby?.longitude ?? null,
            locationFilter.nearby?.radiusMeters ?? null,
            user?.id ?? 'anonymous',
        ],
        queryFn: async () => {
            // Build RPC params from location filter
            const rpcLocationParams = {
                p_city_id: locationFilter.cityId,
                p_user_lat: locationFilter.nearby?.latitude,
                p_user_long: locationFilter.nearby?.longitude,
                p_radius_meters: locationFilter.nearby?.radiusMeters,
            };

            // Fetch all data in parallel
            const [dishTypesResult, heroesResult, risingStarsResult] =
                await Promise.all([
                    // 1. Fetch dish types
                    supabase
                        .from('dish_types')
                        .select('id, name, emoji, icon')
                        .eq('is_active', true)
                        .order('launch_order', { ascending: true }),

                    // 2. Fetch heroes using RPC (excludes user-rated restaurants).
                    // Only the best row per dish type is rendered, so let the
                    // database do that cut instead of shipping every restaurant.
                    supabase.rpc('get_discover_heroes', {
                        ...rpcLocationParams,
                        p_min_ratings: 5,
                        p_per_dish_limit: 1,
                    }),

                    // 3. Fetch rising stars using RPC (excludes user-rated restaurants)
                    supabase.rpc('get_discover_rising_stars', {
                        ...rpcLocationParams,
                        p_min_score: 7.5,
                        p_max_ratings: 10,
                        p_min_ratings: 2,
                        p_per_dish_limit: 1,
                    }),
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
                        restaurant_name: hero.restaurant_name || 'Unknown',
                        neighborhood_name: hero.neighborhood_name || null,
                        bayesian_score: hero.bayesian_score || 5.0,
                        confidence_tier: hero.confidence_tier || 'low',
                        raw_weighted_avg: hero.raw_weighted_avg || 0,
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
                        restaurant_name: star.restaurant_name || 'Unknown',
                        dish_type_id: star.dish_type_id,
                        dish_type_name: star.dish_type_name || 'Dish',
                        dish_type_emoji: star.dish_type_emoji || '🍽️',
                        dish_type_icon: star.dish_type_icon,
                        city_id: star.city_id,

                        neighborhood_id: star.neighborhood_id,
                        neighborhood_name: star.neighborhood_name || null,
                        bayesian_score: star.bayesian_score || 5.0,
                        confidence_tier: star.confidence_tier || 'low',
                        raw_weighted_avg: star.raw_weighted_avg || 0,
                        total_ratings: star.total_ratings || 0,
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
                    icon: dt.icon,
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
        enabled: !!locationFilter.cityId || !!locationFilter.nearby,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
