import { Database } from './database.types';

export type DishType = Database['public']['Tables']['dish_types']['Row'];

export type GlobalDishScore =
    Database['public']['Tables']['global_dish_scores']['Row'];

export type DishTypeVariation =
    Database['public']['Tables']['dish_type_variations']['Row'];
