import { Database } from './database.types';
import { Restaurant } from './restaurant';

export type DishType = Database['public']['Tables']['dish_types']['Row'] & {
    icon?: string | null;
};


export type GlobalDishScore =
    Database['public']['Tables']['global_dish_scores']['Row'];

export type DishTypeVariation =
    Database['public']['Tables']['dish_type_variations']['Row'] & {
        icon?: string | null;
    };


export type RestaurantDish =
    Database['public']['Tables']['restaurant_dishes']['Row'];

export type RestaurantDishWithDetails = RestaurantDish & {
    dish_type: DishType;
    dish_type_variation: DishTypeVariation;
    restaurant: Restaurant;
};
