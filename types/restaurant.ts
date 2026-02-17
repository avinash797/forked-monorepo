import { Database } from './database.types';
import { DishType, DishTypeVariation, RestaurantDish } from './dishes';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type RestaurantDishWithDetails = RestaurantDish & {
    dish_types: DishType;
    dish_type_variations: DishTypeVariation;
};
