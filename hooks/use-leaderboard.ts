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

export function useLeaderboardWithTieBreakers({
    cityId,
    dishTypeId,
    limit = 10,
}: LeaderboardParams) {
    return useQuery({
        queryKey: ['leaderboard', cityId, dishTypeId, limit],
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                'get_leaderboard_with_tiebreakers',
                {
                    p_city_id: cityId,
                    p_dish_type_id: dishTypeId,
                    p_limit: limit,
                }
            );

            if (error) throw error;
            return data;
        },
        enabled: !!cityId && !!dishTypeId,
    });
}

export function useGetLeaderboardByDishType({
    cityId,
    dishTypeId,
    limit = 10,
    minimumBattlesRequirement = 0,
    minimumRatingRequirement = 0,
    neighborhoodId,
}: LeaderboardParams) {
    return useQuery({
        queryKey: ['leaderboard', cityId, dishTypeId, limit],
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

export function useTopDish(cityId: string, dishTypeId: string) {
    return useQuery({
        queryKey: ['topDish', cityId, dishTypeId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                'get_leaderboard_with_tiebreakers',
                {
                    p_city_id: cityId,
                    p_dish_type_id: dishTypeId,
                    p_limit: 1,
                }
            );

            if (error) throw error;
            return data?.[0] || null;
        },
        enabled: !!cityId && !!dishTypeId,
    });
}
