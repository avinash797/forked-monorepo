import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useQuery } from '@tanstack/react-query';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export function useRestaurants(searchQuery: string = '') {
    return useQuery({
        queryKey: ['restaurants', searchQuery],
        queryFn: async () => {
            let query = supabase.from('restaurants').select('*').limit(20);

            if (searchQuery) {
                // Simple ILIKE search for now
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Restaurant[];
        },
        enabled: true, // Always enable for now, or conditionally if query is empty
    });
}

// Future: useNearbyRestaurants using user location
