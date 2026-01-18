import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function useDishTypes() {
    return useQuery({
        queryKey: ['dishTypes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('dish_types')
                .select('*')
                .eq('is_active', true)
                .order('launch_order', { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour - dish types rarely change
    });
}
