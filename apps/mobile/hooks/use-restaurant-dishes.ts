import { supabase } from '@/lib/supabase';
import { Database } from '@forked/supabase';
import { useQuery } from '@tanstack/react-query';

type RestaurantDishRow =
    Database['public']['Tables']['restaurant_dishes']['Row'];
type DishTypeRow = Database['public']['Tables']['dish_types']['Row'];
type VariationRow = Database['public']['Tables']['dish_type_variations']['Row'];

export interface RestaurantDishWithDetails extends Omit<
    RestaurantDishRow,
    'dish_type_id' | 'variation_id'
> {
    dish_type_id: string;
    variation_id: string | null;
    dish_type: Pick<
        DishTypeRow,
        'id' | 'name' | 'emoji' | 'icon' | 'slug' | 'aliases'
    >;
    variation: Pick<
        VariationRow,
        'id' | 'name' | 'emoji' | 'icon' | 'slug'
    > | null;
}

/**
 * Fetch all restaurant_dishes for a given restaurant, joined with
 * dish_types and dish_type_variations.
 * Results are ordered by total_ratings DESC (most popular first).
 */
export function useRestaurantDishes(restaurantId: string | null | undefined) {
    return useQuery({
        queryKey: ['restaurantDishes', restaurantId],
        queryFn: async (): Promise<RestaurantDishWithDetails[]> => {
            if (!restaurantId) return [];

            const { data, error } = await supabase
                .from('restaurant_dishes')
                .select(
                    `
                    *,
                    dish_type:dish_types(id, name, emoji, icon, slug, aliases),
                    variation:dish_type_variations(id, name, emoji, icon, slug)
                `
                )
                .eq('restaurant_id', restaurantId)
                .order('total_ratings', {
                    ascending: false,
                    nullsFirst: false,
                });

            if (error) throw error;
            return (data ?? []) as unknown as RestaurantDishWithDetails[];
        },
        enabled: !!restaurantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
