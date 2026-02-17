import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardParams {
    cityId: string;
    dishTypeId: string;
    neighborhoodId?: string;
    limit?: number;
    minimumBattlesRequirement?: number;
    minimumRatingRequirement?: number;
}

/**
 * Main hook for fetching leaderboard data.
 * Now supports both strict tie-breaking and flexible filtering.
 */
export function useLeaderboard({
    cityId,
    dishTypeId,
    neighborhoodId,
    limit = 10,
    minimumBattlesRequirement = 5,
    minimumRatingRequirement = 2,
}: LeaderboardParams) {
    return useQuery({
        queryKey: [
            'leaderboard',
            cityId,
            dishTypeId,
            neighborhoodId,
            limit,
            minimumBattlesRequirement,
            minimumRatingRequirement,
        ],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_leaderboard', {
                p_city_id: cityId,
                p_dish_type_id: dishTypeId,
                p_neighborhood_id: neighborhoodId,
                p_limit: limit,
                p_min_battles: minimumBattlesRequirement,
                p_min_ratings: minimumRatingRequirement,
            });

            if (error) throw error;
            return data;
        },
        enabled: !!cityId && !!dishTypeId,
    });
}

// Keep aliases for backward compatibility if needed, but they all point to useLeaderboard
export const useLeaderboardWithTieBreakers = useLeaderboard;
export const useGetLeaderboardByDishType = useLeaderboard;
