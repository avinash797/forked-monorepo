import { supabase } from '@/lib/supabase';
import { DishType, GlobalDishScore } from '@/types/dishType';
import { Restaurant } from '@/types/restaurant';
import { TasteTag } from '@/types/taste_tags';
import { useQuery } from '@tanstack/react-query';

export type DishWithRestaurant = GlobalDishScore & {
    restaurant: Restaurant;
    dish_type: DishType;
    tags: TasteTag[];
};

/**
 * Hook to fetch dish details with reviews
 * Used in: Dish detail screen
 */
export function useDishDetail(
    dishId: string | null,
    restaurantId: string | null
) {
    return useQuery({
        queryKey: ['dish', dishId, restaurantId],
        queryFn: async () => {
            if (!dishId) throw new Error('No dish ID provided');
            if (!restaurantId) throw new Error('No restaurant ID provided');

            const { data, error } = await supabase
                .from('global_dish_scores')
                .select(
                    `
            *,
            restaurant:restaurants(*),
            dish_type:dish_types(*)
          `
                )
                .eq('dish_type_id', dishId)
                .eq('restaurant_id', restaurantId)
                .single();

            const { data: tagsData, error: tagsError } = await supabase
                .from('personal_ratings')
                .select(`tags:personal_rating_tags(taste_tags(*))`)
                .eq('dish_type_id', dishId)
                .eq('restaurant_id', restaurantId)
                .single();

            if (error) {
                throw new Error(error.message || 'Dish not found');
            }

            // Transform data to lift tags to the top level
            // We need to match DishWithRestaurant interface where tags are direct children
            const dishData = data as any;
            const transformedData: DishWithRestaurant = {
                ...dishData,
                tags: tagsData?.tags.map((tag: any) => tag.taste_tags) || [],
            };

            return transformedData;
        },
        enabled: !!dishId && !!restaurantId,
    });
}
