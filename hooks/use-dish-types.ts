import { supabase } from '@/lib/supabase';
import { DishType } from '@/types/dishType';
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

export type PrioritizedDishType = DishType & {
    isCityKnown: boolean;
};

/**
 * Fetches dish types prioritized by city relevance.
 * City-known dishes appear first (ordered by display_order),
 * followed by remaining global dish types.
 */
export function useCityDishTypes(cityId: string | null | undefined) {
    return useQuery({
        queryKey: ['dishTypes', 'city', cityId],
        queryFn: async (): Promise<PrioritizedDishType[]> => {
            // Fetch all active dish types
            const { data: allDishTypes, error: dtError } = await supabase
                .from('dish_types')
                .select('*')
                .eq('is_active', true)
                .order('launch_order', { ascending: true });

            if (dtError) throw dtError;
            if (!allDishTypes) return [];

            if (!cityId) {
                return allDishTypes.map((dt) => ({
                    ...dt,
                    isCityKnown: false,
                }));
            }

            // Fetch city-known dish IDs with display_order
            const { data: cityDishes, error: cdError } = await supabase
                .from('city_known_dishes')
                .select('dish_type_id, display_order')
                .eq('city_id', cityId)
                .order('display_order', { ascending: true });

            if (cdError) throw cdError;

            const cityDishMap = new Map(
                (cityDishes ?? []).map((cd) => [
                    cd.dish_type_id,
                    cd.display_order ?? 0,
                ])
            );

            const cityKnown: PrioritizedDishType[] = [];
            const other: PrioritizedDishType[] = [];

            for (const dt of allDishTypes) {
                if (cityDishMap.has(dt.id)) {
                    cityKnown.push({ ...dt, isCityKnown: true });
                } else {
                    other.push({ ...dt, isCityKnown: false });
                }
            }

            // Sort city-known by display_order
            cityKnown.sort(
                (a, b) =>
                    (cityDishMap.get(a.id) ?? 0) -
                    (cityDishMap.get(b.id) ?? 0)
            );

            return [...cityKnown, ...other];
        },
        staleTime: 1000 * 60 * 60,
    });
}
