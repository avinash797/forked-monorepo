import { supabase } from '@/lib/supabase';
import type { DishTypeEntryCount, LeaderboardEntry } from '@/types/rpc.types';
import { useQuery } from '@tanstack/react-query';

export type { LeaderboardEntry };

interface LeaderboardParams {
    cityId: string;
    dishTypeId: string;
    neighborhoodId?: string;
    limit?: number;
}

/**
 * Main hook for fetching leaderboard data.
 * Ordered by Bayesian-smoothed community score.
 * Minimum 2 ratings is hardcoded in the RPC.
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
    });
}

// Keep aliases for backward compatibility if needed, but they all point to useLeaderboard
export const useLeaderboardWithTieBreakers = useLeaderboard;
export const useGetLeaderboardByDishType = useLeaderboard;

export function useLeaderboardDishTypeCounts(cityId: string | null | undefined) {
    return useQuery({
        queryKey: ['leaderboard', 'dish-type-counts', cityId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_dish_type_entry_counts', {
                p_city_id: cityId!,
            });
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
