import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useQuery } from '@tanstack/react-query';

export type DishTypeVariation =
    Database['public']['Tables']['dish_type_variations']['Row'];

/**
 * Fetch all active dish_type_variations, grouped by dish_type_id.
 * Returns a flat array; callers can group/filter as needed.
 */
export function useAllDishTypeVariations() {
    return useQuery({
        queryKey: ['dishTypeVariations'],
        queryFn: async (): Promise<DishTypeVariation[]> => {
            const { data, error } = await supabase
                .from('dish_type_variations')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            return data ?? [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour - variations rarely change
    });
}

/**
 * Helper to group variations by dish_type_id from flat array.
 */
export function groupVariationsByDishType(
    variations: DishTypeVariation[]
): Map<string, DishTypeVariation[]> {
    const map = new Map<string, DishTypeVariation[]>();
    for (const v of variations) {
        const existing = map.get(v.dish_type_id) ?? [];
        existing.push(v);
        map.set(v.dish_type_id, existing);
    }
    return map;
}
