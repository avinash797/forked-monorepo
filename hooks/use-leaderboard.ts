import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardParams {
    cityId: string;
    dishTypeId: string;
    neighborhoodId?: string;
    limit?: number;
    minimumRatingRequirement?: number;
}

/**
 * Main hook for fetching leaderboard data.
 * Ordered by Bayesian-smoothed community score.
 */
export function useLeaderboard({
    cityId,
    dishTypeId,
    neighborhoodId,
    limit = 10,
    minimumRatingRequirement = 2,
}: LeaderboardParams) {
    return useQuery({
        queryKey: [
            'leaderboard',
            cityId,
            dishTypeId,
            neighborhoodId,
            limit,
            minimumRatingRequirement,
        ],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_leaderboard', {
                p_city_id: cityId,
                p_dish_type_id: dishTypeId,
                p_neighborhood_id: neighborhoodId,
                p_limit: limit,
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
