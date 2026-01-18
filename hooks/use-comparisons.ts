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

// Type for process_comparison RPC response
export interface ProcessComparisonResponse {
    success: boolean;
    comparison_id: string;
    winner_new_elo?: number;
    loser_new_elo?: number;
    message: string;
}

export interface ProcessComparisonInput {
    dish_type_id: string;
    rating_a_id: string;
    rating_b_id: string;
    winner_id?: string; // null if skipped
    skipped?: boolean;
    skip_reason?: string;
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
 * Get a specific comparison pair for immediate use after rating
 * Used when create_rating returns should_compare: true
 */
export function useComparisonPair(
    newRatingId: string | null,
    comparisonRatingId: string | null,
    dishTypeId: string | null
) {
    return useQuery({
        queryKey: ['comparisonPair', newRatingId, comparisonRatingId],
        queryFn: async () => {
            if (!newRatingId || !comparisonRatingId || !dishTypeId) return null;

            // Fetch both ratings with restaurant info
            const { data, error } = await supabase
                .from('personal_ratings')
                .select(
                    `
                    id,
                    photo_url,
                    raw_score,
                    restaurant:restaurants(id, name)
                `
                )
                .in('id', [newRatingId, comparisonRatingId]);

            if (error) throw error;
            if (!data || data.length !== 2) return null;

            const ratingA = data.find((r) => r.id === newRatingId);
            const ratingB = data.find((r) => r.id === comparisonRatingId);

            if (!ratingA || !ratingB) return null;

            // Get dish type info
            const { data: dishType } = await supabase
                .from('dish_types')
                .select('id, name')
                .eq('id', dishTypeId)
                .single();

            return {
                dish_type_id: dishTypeId,
                dish_type_name: dishType?.name ?? '',
                rating_a_id: ratingA.id,
                rating_a_photo: ratingA.photo_url,
                rating_a_raw_score: ratingA.raw_score,
                rating_a_restaurant:
                    (ratingA.restaurant as { name: string } | null)?.name ?? '',
                rating_b_id: ratingB.id,
                rating_b_photo: ratingB.photo_url,
                rating_b_raw_score: ratingB.raw_score,
                rating_b_restaurant:
                    (ratingB.restaurant as { name: string } | null)?.name ?? '',
            } as PendingComparison;
        },
        enabled: !!newRatingId && !!comparisonRatingId && !!dishTypeId,
    });
}

/**
 * Process a comparison (This vs That battle)
 * Updates Elo scores for both ratings
 */
export function useProcessComparison() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: ProcessComparisonInput
        ): Promise<ProcessComparisonResponse> => {
            const { data, error } = await supabase.rpc('process_comparison', {
                p_dish_type_id: input.dish_type_id,
                p_rating_a_id: input.rating_a_id,
                p_rating_b_id: input.rating_b_id,
                p_winner_id: input.winner_id,
                p_skipped: input.skipped ?? false,
                p_skip_reason: input.skip_reason,
            });

            if (error) throw error;
            return data as unknown as ProcessComparisonResponse;
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries after comparison
            queryClient.invalidateQueries({ queryKey: ['pendingComparisons'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });

            // Invalidate specific rating queries
            queryClient.invalidateQueries({
                queryKey: ['personalRating', variables.rating_a_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['personalRating', variables.rating_b_id],
            });
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
