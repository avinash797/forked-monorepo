import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/types/rpc.types';
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
