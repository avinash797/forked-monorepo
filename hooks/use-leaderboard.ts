import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardParams {
    cityId: string;
    dishTypeId: string;
    limit?: number;
}

export function useLeaderboard({
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
