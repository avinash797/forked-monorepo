import { supabase } from '@/lib/supabase';
import type { CreateVenueInput, Venue } from '@/types/rating';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useVenueSearch(searchQuery: string = '') {
    return useQuery({
        queryKey: ['venues', 'search', searchQuery],
        queryFn: async (): Promise<Venue[]> => {
            if (!searchQuery || searchQuery.length < 2) {
                return [];
            }

            const { data, error } = await supabase
                .from('venues')
                .select('*')
                .or(
                    `name.ilike.%${searchQuery}%,address_city.ilike.%${searchQuery}%`
                )
                .order('name')
                .limit(20);

            if (error) throw error;
            return data || [];
        },
        enabled: searchQuery.length >= 2,
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useNearbyVenues() {
    return useQuery({
        queryKey: ['venues', 'nearby'],
        queryFn: async (): Promise<Venue[]> => {
            const { data, error } = await supabase
                .from('venues')
                .select('*')
                .limit(50);

            if (error) throw error;
            return data || [];
        },
    });
}

export function useCreateVenue() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateVenueInput): Promise<Venue> => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('venues')
                .insert({
                    ...input,
                    added_by_user_id: user.id,
                    is_chain: false,
                    parent_chain_id: null,
                    hours_of_operation: {},
                    photos: [],
                } as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        },
    });
}
