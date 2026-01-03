import { supabase } from '@/lib/supabase';
import type { CreateReviewInput, Review } from '@/types/rating';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePhotoUpload } from './use-photo-upload';

export function useCreateReview() {
    const queryClient = useQueryClient();
    const { deletePhoto } = usePhotoUpload();
    const {
        isPending: isLoading,
        error,
        mutateAsync,
    } = useMutation({
        mutationFn: async ({
            input,
            photoUrls,
        }: {
            input: CreateReviewInput;
            photoUrls: string[];
        }): Promise<Review> => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const isGpsVerified =
                input.location_latitude !== null &&
                input.location_longitude !== null;

            const { data, error: insertError } = await supabase
                .from('reviews')
                .insert({
                    ...input,
                    user_id: user.id,
                    photo_urls: photoUrls,
                    is_gps_verified: isGpsVerified,
                    is_photo_verified: photoUrls.length > 0,
                    moderation_status: 'pending' as const,
                } as any)
                .select()
                .single();

            if (insertError) throw insertError;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries to refresh data
            if (variables.input.dish_id) {
                queryClient.invalidateQueries({
                    queryKey: ['dish', variables.input.dish_id],
                });
                queryClient.invalidateQueries({
                    queryKey: ['reviews', variables.input.dish_id],
                }); // In case there's a separate reviews query
            }
            if (variables.input.venue_id) {
                queryClient.invalidateQueries({
                    queryKey: ['venue', variables.input.venue_id],
                });
            }
            queryClient.invalidateQueries({ queryKey: ['top-dishes'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
        onError(_, variables) {
            variables.photoUrls.forEach((url) => deletePhoto(url));
        },
    });

    const createReview = (input: CreateReviewInput, photoUrls: string[]) =>
        mutateAsync({ input, photoUrls });

    return {
        createReview,
        isLoading,
        error: (error as Error)?.message || null,
    };
}
