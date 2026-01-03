import { supabase } from '@/lib/supabase';
import type { CreateDishInput, Dish, DishType } from '@/types/rating';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useVenueDishes(venueId: string | null) {
    return useQuery({
        queryKey: ['dishes', 'venue', venueId],
        queryFn: async (): Promise<Dish[]> => {
            if (!venueId) return [];

            const { data, error } = await supabase
                .from('dishes')
                .select('*')
                .eq('venue_id', venueId)
                .eq('is_available', true)
                .order('name');

            if (error) throw error;
            return data || [];
        },
        enabled: !!venueId,
    });
}

export function useCreateDish() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateDishInput): Promise<Dish> => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('dishes')
                .insert({
                    ...input,
                    currency: 'USD',
                    added_by_user_id: user.id,
                } as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['dishes', 'venue', variables.venue_id],
            });
        },
    });
}

export function useDishTypes() {
    return useQuery({
        queryKey: ['dish_types'],
        queryFn: async (): Promise<DishType[]> => {
            const { data, error } = await supabase
                .from('dish_types')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        },
        // Cache heavily as dish types rarely change
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
