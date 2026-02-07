import { Database } from './database.types';
import { DishType, DishTypeVariation } from './dishes';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type RestaurantDish =
    Database['public']['Tables']['restaurant_dishes']['Row'];

export type RestaurantDishWithDetails = RestaurantDish & {
    dish_types: DishType;
    dish_type_variations: DishTypeVariation;
};
