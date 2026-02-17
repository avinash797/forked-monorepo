import { Database } from './database.types';
import { DishType, DishTypeVariation, RestaurantDish } from './dishes';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type RestaurantDishWithDetails = RestaurantDish & {
    type: DishType;
    variation: DishTypeVariation;
};

/**
 * A dish grouped by dish_type_id, with all variations collected into an array.
 * Used in restaurant detail to de-duplicate dishes that share the same type.
 */
export type GroupedRestaurantDish = Omit<
    RestaurantDishWithDetails,
    'variation'
> & {
    avg_raw_score: number | null;
    variations: (DishTypeVariation & {
        /** The restaurant_dish row ID for this variation */
        restaurant_dish_id: string;
        total_ratings: number | null;
        photos: string[] | null;
    })[];
};
