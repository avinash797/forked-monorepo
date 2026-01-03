import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export type CharmDetail = Database['public']['Tables']['charms']['Row'];

export function useCharm(charmId: string | undefined) {
    return useQuery({
        queryKey: ['charm', charmId],
        queryFn: async (): Promise<CharmDetail | null> => {
            if (!charmId) return null;

            const { data, error } = await supabase
                .from('charms')
                .select('*')
                .eq('id', charmId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!charmId,
        staleTime: 1000 * 60 * 60 * 24, // Charms are static mostly, cache for 24h
    });
}

export function useUserCharms(userId: string | undefined) {
    return useQuery({
        queryKey: ['user_charms', userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('user_charms')
                .select('*, charms(*)')
                .eq('user_id', userId)
                .order('unlocked_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
    });
}
