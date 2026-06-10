import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteAccountResponse {
    success: boolean;
    message: string;
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (): Promise<DeleteAccountResponse> => {
            // supabase.functions.invoke automatically passes the current
            // session's access token in the Authorization header
            const { data, error } = await supabase.functions.invoke(
                'delete-account'
            );

            if (error) {
                throw new Error(
                    error.message || 'Failed to delete account'
                );
            }

            if (!data?.success) {
                throw new Error(data?.error || 'Failed to delete account');
            }

            return data as DeleteAccountResponse;
        },
        onSuccess: async () => {
            await supabase.auth.signOut();
            queryClient.clear();
        },
    });
}
