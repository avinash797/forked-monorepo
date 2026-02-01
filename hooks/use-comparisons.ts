import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Type for pending comparison from get_pending_comparisons RPC
export interface PendingComparison {
    dish_type_id: string;
    dish_type_name: string;
    rating_a_id: string;
    rating_a_photo: string;
    rating_a_raw_score: number;
    rating_a_restaurant: string;
    rating_b_id: string;
    rating_b_photo: string;
    rating_b_raw_score: number;
    rating_b_restaurant: string;
}

export interface SubmitComparisonInput {
    comparison_id: string;
    winner_rating_id: string;
    dish_type_id: string; // Used for cache invalidation only
}

/**
 * Get pending comparisons for the current user
 * These are pairs of dishes that need to be compared in This vs That
 */
export function usePendingComparisons(limit: number = 5) {
    return useQuery({
        queryKey: ['pendingComparisons', limit],
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                'get_pending_comparisons',
                {
                    p_limit: limit,
                }
            );

            if (error) throw error;
            return (data ?? []) as PendingComparison[];
        },
        staleTime: 1000 * 30, // 30 seconds - comparisons can change frequently
    });
}

/**
 * Submit a duel created by post_rating_and_get_duel
 * Uses the new submit_comparison RPC which takes a pre-created comparison_id
 */
export function useSubmitComparison() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: SubmitComparisonInput): Promise<void> => {
            const { error } = await supabase.rpc('submit_comparison', {
                p_comparison_id: input.comparison_id,
                p_winner_rating_id: input.winner_rating_id,
            });

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pendingComparisons'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
        },
    });
}

export interface ProcessComparisonInput {
    dish_type_id: string;
    rating_a_id: string;
    rating_b_id: string;
    winner_id?: string;
    skipped?: boolean;
    skip_reason?: string;
}

/**
 * Process a pending comparison (standalone This vs That)
 * Uses the original process_comparison RPC for comparisons not created by post_rating_and_get_duel
 */
export function useProcessComparison() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ProcessComparisonInput) => {
            const { data, error } = await supabase.rpc('process_comparison', {
                p_dish_type_id: input.dish_type_id,
                p_rating_a_id: input.rating_a_id,
                p_rating_b_id: input.rating_b_id,
                p_winner_id: input.winner_id,
                p_skipped: input.skipped ?? false,
                p_skip_reason: input.skip_reason,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pendingComparisons'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
        },
    });
}

/**
 * Check user's skip rate for comparisons
 * Warns if they're skipping too many
 */
export function useCheckSkipRate() {
    return useQuery({
        queryKey: ['skipRate'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('check_user_skip_rate');

            if (error) throw error;
            return (
                data?.[0] ?? {
                    skip_rate: 0,
                    skipped_count: 0,
                    total_comparisons: 0,
                    should_warn: false,
                }
            );
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
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
                    rating_a:personal_ratings!comparisons_rating_a_id_fkey(
                        id,
                        photo_url,
                        restaurant:restaurants(name)
                    ),
                    rating_b:personal_ratings!comparisons_rating_b_id_fkey(
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
