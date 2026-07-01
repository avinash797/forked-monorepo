export * from './auth';
export * from './taste-tags';
export * from './dishes';
// `restaurant` also declares a (different) RestaurantDishWithDetails — import
// it via `@forked/types/restaurant` when you need that variant.
export type {
    RawRestaurant,
    Restaurant,
    RestaurantWithNeighborhood,
    GroupedRestaurantDish,
    LocationProperties,
} from './restaurant';
