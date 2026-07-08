import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

interface BlockUserInput {
    ratingId: string;
    dishId?: string;
    restaurantId?: string;
}

interface BlockUserResponse {
    success: boolean;
    already_blocked?: boolean;
}

export function useBlockUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: BlockUserInput
        ): Promise<BlockUserResponse> => {
            const { data, error } = await supabase.rpc('block_user', {
                p_rating_id: input.ratingId,
            });

            if (error) throw error;
            return data as unknown as BlockUserResponse;
        },
        onSuccess: (data, variables) => {
            // Invalidate all surfaces that show personal_ratings photos
            if (variables.restaurantId) {
                queryClient.invalidateQueries({
                    queryKey: ['restaurant', variables.restaurantId],
                });
            }
            if (variables.dishId && variables.restaurantId) {
                queryClient.invalidateQueries({
                    queryKey: [
                        'dish-menu',
                        variables.dishId,
                        variables.restaurantId,
                    ],
                });
                queryClient.invalidateQueries({
                    queryKey: [
                        'dish-ratings',
                        variables.dishId,
                        variables.restaurantId,
                    ],
                });
            }

            if (data.already_blocked) {
                Alert.alert(
                    'Already Blocked',
                    'You have already blocked this user.'
                );
            } else {
                Alert.alert(
                    'User Blocked',
                    "This user's content will be hidden from your feed."
                );
            }
        },
        onError: (error: Error) => {
            if (error.message?.includes('Cannot block yourself')) {
                Alert.alert('Error', 'You cannot block yourself.');
            } else {
                Alert.alert('Error', 'Failed to block user. Please try again.');
            }
        },
    });
}
