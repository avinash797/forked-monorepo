import { supabase } from '@/lib/supabase';
import { DishType, GlobalDishScore } from '@/types/dishes';
import { Restaurant } from '@/types/restaurant';
import { TasteTag } from '@/types/taste_tags';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export type DishWithRestaurant = GlobalDishScore & {
    restaurant: Restaurant;
    dish_type: DishType;
    tags: (TasteTag & { count: number })[];
    userRatingData: {
        user_id: string;
        raw_score: number;
        tags: (TasteTag & { count: number })[];
    };
};

/**
 * Hook to fetch dish details with reviews
 * Used in: Dish detail screen
 */
export function useDishDetail(
    dishId: string | null,
    restaurantId: string | null
) {
    const { user } = useAuth();
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
                .maybeSingle();

            const { data: personalRatingData, error: tagsError } =
                await supabase
                    .from('personal_ratings')
                    .select(
                        `user_id, raw_score, tags:personal_rating_tags(taste_tags(*))`
                    )
                    .eq('dish_type_id', dishId)
                    .eq('restaurant_id', restaurantId);

            if (error) {
                throw new Error(error.message || 'Failed to fetch dish');
            }

            if (!data) {
                throw new Error('This dish has not been rated yet');
            }

            const tagMap = new Map<string, TasteTag & { count: number }>();
            personalRatingData?.forEach((rating: any) => {
                rating.tags?.forEach((t: any) => {
                    if (t.taste_tags) {
                        const tag = t.taste_tags;
                        const existing = tagMap.get(tag.id);
                        if (existing) {
                            existing.count++;
                        } else {
                            tagMap.set(tag.id, { ...tag, count: 1 });
                        }
                    }
                });
            });

            const flatTags = Array.from(tagMap.values()).sort(
                (a, b) => b.count - a.count
            );

            // Transform data to lift tags to the top level
            // We need to match DishWithRestaurant interface where tags are direct children
            const dishData = data as any;
            const transformedData: DishWithRestaurant = {
                ...dishData,
                tags: flatTags,
                userRatingData: personalRatingData?.find(
                    (rating: any) => rating.user_id === user?.id
                ),
            };

            return transformedData;
        },
        enabled: !!dishId && !!restaurantId,
    });
}
