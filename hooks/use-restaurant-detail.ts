import { supabase } from '@/lib/supabase';
import { Restaurant, RestaurantDishWithDetails } from '@/types/restaurant';
import { useQuery } from '@tanstack/react-query';

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
            // Sort by average rating (highest first), then by name
            const { data: dishesData, error: dishesError } = await supabase
                .from('restaurant_dishes')
                .select(`*, dish_types(*), dish_type_variations(*)`)
                .eq('restaurant_id', restaurantId)
                .order('total_ratings', {
                    ascending: false,
                    nullsFirst: false,
                });

            if (dishesError) {
                throw new Error(dishesError.message || 'Failed to load dishes');
            }

            const dishes = dishesData as RestaurantDishWithDetails[];

            return { venue, dishes };
        },
        enabled: !!restaurantId,
        select: (data) => data, // Pass through
    });
}
