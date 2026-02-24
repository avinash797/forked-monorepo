import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProcessBattleResponse } from './use-ratings';

export interface ProcessBattleInput {
    battle_id: string;
    winner_rating_id: string;
    dish_type_id: string; // Used for cache invalidation only
}

export interface SkipBattleInput {
    battle_id: string;
    skip_reason?: string;
    dish_type_id: string; // Used for cache invalidation only
}

/**
 * Process a battle step in the binary insertion sort sequence.
 * Returns done=true with final rank/score, or done=false with the next battle.
 * Only invalidates leaderboard/stats when the sequence is complete.
 */
export function useProcessBattle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ProcessBattleInput): Promise<ProcessBattleResponse> => {
            const { data, error } = await supabase.rpc('process_battle', {
                p_battle_id: input.battle_id,
                p_winner_rating_id: input.winner_rating_id,
            } as any);

            if (error) throw error;
            return data as unknown as ProcessBattleResponse;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            if (data.done) {
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                queryClient.invalidateQueries({ queryKey: ['topDish'] });
                queryClient.invalidateQueries({ queryKey: ['userStats'] });
                queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
            }
        },
    });
}

/**
 * Skip a battle step in the binary insertion sort sequence.
 * Advances to the next opponent or forces completion if skips are exhausted.
 * Returns same shape as useProcessBattle.
 */
export function useSkipBattle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: SkipBattleInput): Promise<ProcessBattleResponse> => {
            const { data, error } = await supabase.rpc('skip_battle', {
                p_battle_id: input.battle_id,
                p_skip_reason: input.skip_reason ?? null,
            } as any);

            if (error) throw error;
            return data as unknown as ProcessBattleResponse;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            if (data.done) {
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                queryClient.invalidateQueries({ queryKey: ['topDish'] });
                queryClient.invalidateQueries({ queryKey: ['userStats'] });
                queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
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

// Skip reason options for the UI
export const SKIP_REASONS = [
    { value: 'cant_remember', label: "Can't remember one of them" },
    { value: 'too_different', label: 'Too different to compare' },
    { value: 'havent_tried', label: "Haven't tried one recently" },
    { value: 'same_restaurant', label: 'Same restaurant, unfair' },
    { value: 'other', label: 'Other' },
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number]['value'];

// ---------------------------------------------------------------------------
// Deprecated — kept for backwards compatibility, no longer called
// ---------------------------------------------------------------------------

/** @deprecated Use useProcessBattle instead */
export function useSubmitComparison() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (_input: { comparison_id: string; winner_rating_id: string; dish_type_id: string }): Promise<void> => {
            throw new Error('submit_comparison has been removed. Use process_battle via useProcessBattle.');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
    });
}

/** @deprecated Use useProcessBattle instead */
export function useProcessComparison() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (_input: unknown) => {
            throw new Error('process_comparison has been removed. Use process_battle via useProcessBattle.');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
    });
}

/** @deprecated get_pending_comparisons has been removed */
export function usePendingComparisons(_limit: number = 5) {
    return useQuery({
        queryKey: ['pendingComparisons', _limit],
        queryFn: async () => [] as never[],
        staleTime: Infinity,
    });
}
