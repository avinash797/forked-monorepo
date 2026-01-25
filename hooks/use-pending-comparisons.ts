import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Pending comparison item representing a pair of dishes to compare
 */
export interface PendingComparison {
    dish_type_id: string;
    dish_type_name: string;
    rating_a_id: string;
    rating_a_restaurant: string;
    rating_a_photo: string | null;
    rating_a_raw_score: number;
    rating_b_id: string;
    rating_b_restaurant: string;
    rating_b_photo: string | null;
    rating_b_raw_score: number;
}

/**
 * Hook to fetch pending dish comparisons for the authenticated user
 *
 * Calls the get_pending_comparisons RPC function to find pairs of
 * user's ratings that are close in score and haven't been compared yet.
 *
 * Used in: Home screen CTA, Compare prompt
 *
 * @example
 * ```tsx
 * const { comparisons, hasPending, isLoading } = usePendingComparisons();
 *
 * if (hasPending) {
 *   return <PendingComparisonsCTA comparisons={comparisons} />;
 * }
 * ```
 */
export function usePendingComparisons(options: { limit?: number } = {}) {
    const { limit = 5 } = options;

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ['pending-comparisons', limit],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_pending_comparisons', {
                p_limit: limit,
            });

            if (error) throw error;

            return (data || []) as PendingComparison[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
    });

    return {
        /** Array of pending comparison pairs */
        comparisons: data || [],
        /** Whether the user has pending comparisons */
        hasPending: (data?.length ?? 0) > 0,
        /** Number of pending comparisons */
        count: data?.length ?? 0,
        /** Loading state */
        isLoading,
        /** Error message if query failed */
        error: error ? (error as Error).message : null,
        /** Function to manually refetch data */
        refetch: () => refetch(),
    };
}
