import { supabase } from '@/lib/supabase';
import { useBadgeStore } from '@/stores/use-badge-store';
import { Database } from '@/types/database.types';
import type {
    BattleOpponent,
    CreateRatingResponse,
    PersonalRankingEntry,
    SubmitComparisonResponse,
} from '@/types/rpc.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type PersonalRating = Database['public']['Tables']['personal_ratings']['Row'];

export type Sentiment = 'liked' | 'okay' | 'disliked';

// Re-export RPC types for backward compatibility
export type { BattleOpponent, CreateRatingResponse, PersonalRankingEntry };
/** @deprecated Use SubmitComparisonResponse instead */
export type ProcessBattleResponse = SubmitComparisonResponse;

export interface CreateRatingInput {
    restaurant_id: string;
    dish_type_id: string;
    sentiment: Sentiment;
    photo_url?: string;
    photo_storage_path?: string;
    variation_id?: string;
    notes?: string;
    taste_tag_ids?: string[];
}

/**
 * Create a new rating using the create_rating RPC.
 * Returns battle data when an insertion-sort battle sequence needs to start.
 */
export function useCreateRating() {
    const queryClient = useQueryClient();
    const { addBadges } = useBadgeStore();

    return useMutation({
        mutationFn: async (
            input: CreateRatingInput
        ): Promise<CreateRatingResponse> => {
            const { data, error } = await supabase.rpc('create_rating', {
                p_restaurant_id: input.restaurant_id,
                p_dish_type_id: input.dish_type_id,
                p_sentiment: input.sentiment,
                p_photo_url: input.photo_url ?? undefined,
                p_photo_storage_path: input.photo_storage_path ?? undefined,
                p_variation_id: input.variation_id ?? undefined,
                p_notes: input.notes ?? undefined,
                p_taste_tag_ids: input.taste_tag_ids ?? undefined,
            });

            if (error) throw error;
            return data as unknown as CreateRatingResponse;
        },
        onSuccess: (data, variables) => {
            // Only invalidate leaderboard when no battle is needed (score is final)
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
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
        },
    });
}

/**
 * Get a user's personal ratings for a specific dish type
 */
export function useMyDishRankings(dishTypeId?: string) {
    return useQuery({
        queryKey: ['myDishRankings', dishTypeId],
        queryFn: async () => {
            if (!dishTypeId) return [];

            const { data, error } = await supabase.rpc('get_personal_rankings', {
                p_dish_type_id: dishTypeId,
            });

            if (error) throw error;
            return (data ?? []) as unknown as PersonalRankingEntry[];
        },
        enabled: !!dishTypeId,
    });
}

/**
 * Get a single personal rating by ID
 */
export function usePersonalRating(ratingId: string | null) {
    return useQuery({
        queryKey: ['personalRating', ratingId],
        queryFn: async () => {
            if (!ratingId) return null;

            const { data, error } = await supabase
                .from('personal_ratings')
                .select(
                    `
                    *,
                    restaurant:restaurants(id, name, address, neighborhood_id),
                    dish_type:dish_types(id, name, emoji)
                `
                )
                .eq('id', ratingId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!ratingId,
    });
}

/**
 * Get all personal ratings for the current user
 */
export function useMyRatings(dishTypeId?: string) {
    return useQuery({
        queryKey: ['myRatings', dishTypeId],
        queryFn: async () => {
            let query = supabase
                .from('personal_ratings')
                .select(
                    `
                    *,
                    restaurant:restaurants(id, name, address),
                    dish_type:dish_types(id, name, emoji)
                `
                )
                .order('created_at', { ascending: false });

            if (dishTypeId) {
                query = query.eq('dish_type_id', dishTypeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data ?? [];
        },
    });
}

/**
 * Get taste tags for a dish type
 */
export function useTasteTags(dishTypeId: string | null) {
    return useQuery({
        queryKey: ['tasteTags', dishTypeId],
        queryFn: async () => {
            let query = supabase.from('taste_tags').select('*');

            if (dishTypeId) {
                query = query.or(
                    `dish_type_id.eq.${dishTypeId},dish_type_id.is.null`
                );
            }

            const { data, error } = await query;

            if (error) throw error;
            return data ?? [];
        },
        enabled: true,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
