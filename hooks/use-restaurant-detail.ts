import { supabase } from '@/lib/supabase';
import {
    GroupedRestaurantDish,
    Restaurant,
    RestaurantDishWithDetails,
} from '@/types/restaurant';
import { useQuery } from '@tanstack/react-query';

/**
 * Groups dishes by dish_type_id, de-duplicating entries and collecting
 * all variations into an array on each grouped dish.
 */
function groupDishesByType(
    dishes: RestaurantDishWithDetails[]
): GroupedRestaurantDish[] {
    const groupMap = new Map<string, GroupedRestaurantDish>();

    for (const dish of dishes) {
        const existing = groupMap.get(dish.dish_type_id);

        const variationEntry = {
            ...(dish.variation ?? {}),
            restaurant_dish_id: dish.id,
            total_ratings: dish.total_ratings,
            photos: dish.photos,
        };

        if (existing) {
            // Append this variation to the existing group
            existing.variations.push(
                variationEntry as GroupedRestaurantDish['variations'][number]
            );

            // Merge photos
            if (dish.photos?.length) {
                existing.photos = [...(existing.photos ?? []), ...dish.photos];
            }

            // Sum total ratings
            existing.total_ratings =
                (existing.total_ratings ?? 0) + (dish.total_ratings ?? 0);
        } else {
            // Create a new group from this dish
            const { variation: _variation, ...rest } = dish;
            groupMap.set(dish.dish_type_id, {
                ...rest,
                avg_raw_score: null,
                variations: [
                    variationEntry as GroupedRestaurantDish['variations'][number],
                ],
            });
        }
    }

    return Array.from(groupMap.values());
}

/**
 * Hook to fetch venue details with all dishes
 * Used in: Venue detail screen
 */
export function useRestaurantDetail(restaurantId: string | null) {
    return useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant ID provided');

            // Fetch venue
            const { data: restaurantData, error: restaurantError } =
                await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', restaurantId)
                    .single();

            if (restaurantError) {
                throw new Error(restaurantError.message || 'Venue not found');
            }

            const venue = restaurantData as Restaurant;

            // Fetch all dishes for this venue
            // Sort by total ratings (highest first)
            const { data: dishesData, error: dishesError } = await supabase
                .from('restaurant_dishes')
                .select(
                    `*, type:dish_types(*), variation:dish_type_variations(*)`
                )
                .eq('restaurant_id', restaurantId)
                .order('total_ratings', {
                    ascending: false,
                    nullsFirst: false,
                });

            if (dishesError) {
                throw new Error(dishesError.message || 'Failed to load dishes');
            }

            const { data: ratingsData, error: ratingsError } = await supabase
                .from('global_dish_scores')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (ratingsError) {
                throw new Error(
                    ratingsError.message || 'Failed to load ratings'
                );
            }

            const rawDishes = dishesData as RestaurantDishWithDetails[];

            // Group dishes by dish_type_id, collecting variations into an array
            const dishes = groupDishesByType(rawDishes).map((dish) => {
                const rating = ratingsData.find(
                    (rating) => rating.dish_type_id === dish.dish_type_id
                )?.avg_raw_score;
                return {
                    ...dish,
                    avg_raw_score: rating,
                };
            }) as GroupedRestaurantDish[];

            return { venue, dishes };
        },
        enabled: !!restaurantId,
        select: (data) => data, // Pass through
    });
}
