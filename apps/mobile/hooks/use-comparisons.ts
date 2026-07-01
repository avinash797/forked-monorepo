import { supabase } from '@/lib/supabase';
import { useBadgeStore } from '@/stores/use-badge-store';
import type { SubmitComparisonResponse } from '@forked/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ProcessBattleInput {
    battle_id: string;
    winner_rating_id: string;
    new_rating_id: string;
    dish_type_id: string; // Used for cache invalidation only
}

export interface SkipBattleInput {
    battle_id: string;
    dish_type_id: string; // Used for cache invalidation only
}

/**
 * Process a battle step in the binary insertion sort sequence.
 * Calls submit_comparison with p_result = 'new_wins' or 'opponent_wins'.
 * Only invalidates leaderboard/stats when the sequence is complete.
 */
export function useProcessBattle() {
    const queryClient = useQueryClient();
    const { addBadges } = useBadgeStore();

    return useMutation({
        mutationFn: async (
            input: ProcessBattleInput
        ): Promise<SubmitComparisonResponse> => {
            const p_result =
                input.winner_rating_id === input.new_rating_id
                    ? 'new_wins'
                    : 'opponent_wins';

            const { data, error } = await supabase.rpc('submit_comparison', {
                p_battle_id: input.battle_id,
                p_result,
            });

            if (error) throw error;
            return data as unknown as SubmitComparisonResponse;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            if (data.battle_complete) {
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                queryClient.invalidateQueries({ queryKey: ['topDish'] });
                queryClient.invalidateQueries({ queryKey: ['userStats'] });
                queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
                if (data.new_badges?.length) {
                    addBadges(data.new_badges);
                    queryClient.invalidateQueries({ queryKey: ['userBadges'] });
                }
            }
        },
    });
}

/**
 * Skip a battle step. Calls submit_comparison with p_result = 'skipped'.
 * Skip ends the battle immediately — there is no concept of remaining skips.
 */
export function useSkipBattle() {
    const queryClient = useQueryClient();
    const { addBadges } = useBadgeStore();

    return useMutation({
        mutationFn: async (
            input: SkipBattleInput
        ): Promise<SubmitComparisonResponse> => {
            const { data, error } = await supabase.rpc('submit_comparison', {
                p_battle_id: input.battle_id,
                p_result: 'skipped',
            });

            if (error) throw error;
            return data as unknown as SubmitComparisonResponse;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            // Skip always ends the battle, so always invalidate
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
            if (data.new_badges?.length) {
                addBadges(data.new_badges);
                queryClient.invalidateQueries({ queryKey: ['userBadges'] });
            }
        },
    });
}

/**
 * Get comparison history for the current user
 */
export function useComparisonHistory(limit: number = 20) {
    return useQuery({
        queryKey: ['comparisonHistory', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('comparisons')
                .select(
                    `
                    *,
                    dish_type:dish_types(id, name, emoji),
                    new_rating:personal_ratings!comparisons_new_rating_id_fkey(
                        id,
                        photo_url,
                        restaurant:restaurants(name)
                    ),
                    opponent_rating:personal_ratings!comparisons_opponent_rating_id_fkey(
                        id,
                        photo_url,
                        restaurant:restaurants(name)
                    )
                `
                )
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data ?? [];
        },
    });
}
