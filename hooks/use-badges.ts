import { supabase } from '@/lib/supabase';
import type { UserBadge } from '@/types/badge.types';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetch all badge definitions with earned_at status for a user.
 * Replaces the client-side useUserBadges in use-user-stats.ts.
 */
export function useUserBadges(userId?: string) {
    return useQuery({
        queryKey: ['userBadges', userId],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.rpc as any)(
                'get_user_badges',
                { p_user_id: userId ?? null }
            );

            if (error) throw error;
            return (data ?? []) as UserBadge[];
        },
    });
}
