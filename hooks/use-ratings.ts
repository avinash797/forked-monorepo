import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type PersonalRating = Database['public']['Tables']['personal_ratings']['Row'];

// Type for the create_rating RPC response
export interface CreateRatingResponse {
    rating_id: string;
    should_compare: boolean;
    comparison_candidate_id: string | null;
}

export interface CreateRatingInput {
    restaurant_id: string;
    dish_type_id: string;
    raw_score: number; // 1-10 scale
    photo_url: string;
    photo_storage_path?: string;
    notes?: string;
    location_verified?: boolean;
    taste_tag_ids?: string[];
}

/**
 * Create a new rating using the create_rating RPC
 * This handles the Elo initialization and determines if a comparison should be triggered
 */
export function useCreateRating() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: CreateRatingInput
        ): Promise<CreateRatingResponse> => {
            const { data, error } = await supabase.rpc('create_rating', {
                p_restaurant_id: input.restaurant_id,
                p_dish_type_id: input.dish_type_id,
                p_raw_score: input.raw_score,
                p_photo_url: input.photo_url,
                p_photo_storage_path: input.photo_storage_path,
                p_notes: input.notes,
                p_location_verified: input.location_verified ?? false,
                p_taste_tag_ids: input.taste_tag_ids,
            });

            if (error) throw error;
            return data as unknown as CreateRatingResponse;
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
            queryClient.invalidateQueries({
                queryKey: ['myDishRankings', variables.dish_type_id],
            });
        },
    });
}

/**
 * Update an existing rating
 */
export function useUpdateRating() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            rating_id: string;
            new_raw_score: number;
            new_photo_url?: string;
            new_notes?: string;
            taste_tag_ids?: string[];
        }) => {
            const { data, error } = await supabase.rpc(
                'update_existing_rating',
                {
                    p_rating_id: input.rating_id,
                    p_new_raw_score: input.new_raw_score,
                    p_new_photo_url: input.new_photo_url,
                    p_new_notes: input.new_notes,
                    p_taste_tag_ids: input.taste_tag_ids,
                }
            );

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['topDish'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            queryClient.invalidateQueries({ queryKey: ['myBestEver'] });
            queryClient.invalidateQueries({ queryKey: ['myDishRankings'] });
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

            const { data, error } = await supabase.rpc('get_my_dish_rankings', {
                p_dish_type_id: dishTypeId,
            });

            if (error) throw error;
            return data ?? [];
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
 * Check rate limit before submitting a rating
 */
export function useCheckRateLimit() {
    return useQuery({
        queryKey: ['rateLimit'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('check_rate_limit');

            if (error) throw error;
            return (
                data?.[0] ?? {
                    can_rate: true,
                    is_rate_limited: false,
                    ratings_last_hour: 0,
                    max_allowed: 10,
                }
            );
        },
        staleTime: 1000 * 60, // 1 minute
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
                // Get tags specific to dish type OR universal tags (null dish_type_id)
                query = query.or(
                    `dish_type_id.eq.${dishTypeId},dish_type_id.is.null`
                );
            }

            const { data, error } = await query;

            if (error) throw error;
            return data ?? [];
        },
        enabled: true,
        staleTime: 1000 * 60 * 60, // 1 hour - tags rarely change
    });
}
