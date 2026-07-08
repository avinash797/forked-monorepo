import { supabase } from '@/lib/supabase';
import type { DishTypeEntryCount, LeaderboardEntry } from '@forked/supabase';
import { useQuery } from '@tanstack/react-query';

export type { LeaderboardEntry };

/**
 * Base URL of the web app's CDN-cached leaderboard API. When set, public
 * leaderboard reads go through the CDN (~5 min staleness) instead of hitting
 * Postgres on every pull. Unset (e.g. local dev) falls back to the RPC.
 */
const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL;

const LEADERBOARD_STALE_TIME = 1000 * 60 * 5; // matches CDN s-maxage

interface LeaderboardParams {
    cityId: string;
    dishTypeId: string;
    neighborhoodId?: string;
    limit?: number;
}

async function fetchLeaderboardFromCdn({
    cityId,
    dishTypeId,
    neighborhoodId,
    limit,
}: Required<Pick<LeaderboardParams, 'cityId' | 'dishTypeId' | 'limit'>> &
    Pick<LeaderboardParams, 'neighborhoodId'>): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({
        city_id: cityId,
        dish_type_id: dishTypeId,
        limit: String(limit),
    });
    if (neighborhoodId) params.set('neighborhood_id', neighborhoodId);

    const response = await fetch(
        `${WEB_API_URL}/api/v1/leaderboard?${params.toString()}`
    );
    if (!response.ok) {
        throw new Error(`Leaderboard API failed: ${response.status}`);
    }
    return (await response.json()) as LeaderboardEntry[];
}

/**
 * Main hook for fetching leaderboard data.
 * Ordered by Bayesian-smoothed community score.
 * Minimum ratings per entry comes from app_constants (LEADERBOARD_MIN_RATERS).
 */
export function useLeaderboard({
    cityId,
    dishTypeId,
    neighborhoodId,
    limit = 10,
}: LeaderboardParams) {
    return useQuery({
        queryKey: ['leaderboard', cityId, dishTypeId, neighborhoodId, limit],
        queryFn: async () => {
            if (WEB_API_URL) {
                try {
                    return await fetchLeaderboardFromCdn({
                        cityId,
                        dishTypeId,
                        neighborhoodId,
                        limit,
                    });
                } catch {
                    // CDN path is an optimization — fall through to the RPC
                }
            }

            const { data, error } = await supabase.rpc('get_leaderboard', {
                p_city_id: cityId,
                p_dish_type_id: dishTypeId,
                p_neighborhood_id: neighborhoodId,
                p_limit: limit,
            });

            if (error) throw error;
            return (data ?? []) as unknown as LeaderboardEntry[];
        },
        enabled: !!cityId && !!dishTypeId,
        staleTime: LEADERBOARD_STALE_TIME,
    });
}

// Keep aliases for backward compatibility if needed, but they all point to useLeaderboard
export const useLeaderboardWithTieBreakers = useLeaderboard;
export const useGetLeaderboardByDishType = useLeaderboard;

interface NearbyLeaderboardParams {
    dishTypeId: string;
    latitude: number | null;
    longitude: number | null;
    radiusMeters?: number;
    limit?: number;
}

export function useNearbyLeaderboard({
    dishTypeId,
    latitude,
    longitude,
    radiusMeters = 3218, // ~2 miles
    limit = 10,
}: NearbyLeaderboardParams) {
    return useQuery({
        queryKey: [
            'leaderboard',
            'nearby',
            dishTypeId,
            latitude,
            longitude,
            radiusMeters,
            limit,
        ],
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                'get_nearby_leaderboard',
                {
                    p_dish_type_id: dishTypeId,
                    p_latitude: latitude!,
                    p_longitude: longitude!,
                    p_radius_meters: radiusMeters,
                    p_limit: limit,
                }
            );
            if (error) throw error;
            return (data ?? []) as unknown as LeaderboardEntry[];
        },
        enabled: !!dishTypeId && !!latitude && !!longitude,
        staleTime: LEADERBOARD_STALE_TIME,
    });
}

export function useLeaderboardDishTypeCounts(
    cityId: string | null | undefined
) {
    return useQuery({
        queryKey: ['leaderboard', 'dish-type-counts', cityId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                'get_dish_type_entry_counts',
                {
                    p_city_id: cityId!,
                }
            );
            if (error) throw error;

            const counts = new Map<string, number>();
            for (const row of (data ?? []) as DishTypeEntryCount[]) {
                counts.set(row.dish_type_id, row.entry_count);
            }
            return counts;
        },
        enabled: !!cityId,
        staleTime: 1000 * 60 * 5, // 5 min
    });
}
