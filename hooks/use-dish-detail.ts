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
    menuData: {
        variations: string[];
        photos: string[];
    };
};

// ── Primary query: global_dish_scores + restaurant + dish_type ──────────
export function useDishCore(
    dishId: string | null,
    restaurantId: string | null
) {
    return useQuery({
        queryKey: ['dish-core', dishId, restaurantId],
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

            if (error) {
                throw new Error(error.message || 'Failed to fetch dish');
            }

            if (!data) {
                throw new Error('This dish has not been rated yet');
            }

            return data as GlobalDishScore & {
                restaurant: Restaurant;
                dish_type: DishType;
            };
        },
        enabled: !!dishId && !!restaurantId,
    });
}

// ── Secondary query: restaurant_dishes (photos + variations) ────────────
export function useDishMenu(
    dishId: string | null,
    restaurantId: string | null
) {
    return useQuery({
        queryKey: ['dish-menu', dishId, restaurantId],
        queryFn: async () => {
            if (!dishId || !restaurantId) return { variations: [], photos: [] };

            const { data: restaurantDishData } = await supabase
                .from('restaurant_dishes')
                .select(`*, variation:dish_type_variations(name, is_active)`)
                .eq('dish_type_id', dishId)
                .eq('restaurant_id', restaurantId);

            console.log('restaurantDishData', { restaurantDishData });

            return {
                variations:
                    restaurantDishData
                        ?.map((v: any) => v.variation)
                        .filter((v: any) => v !== null)
                        .map((v: any) => v.name) ?? [],
                photos:
                    restaurantDishData?.flatMap((v: any) => v.photos.flat()) ??
                    [],
            };
        },
        enabled: !!dishId && !!restaurantId,
    });
}

// ── Secondary query: personal_ratings (tags + user rating) ──────────────
export function useDishRatings(
    dishId: string | null,
    restaurantId: string | null
) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['dish-ratings', dishId, restaurantId, user?.id],
        queryFn: async () => {
            if (!dishId || !restaurantId)
                return { tags: [], userRatingData: undefined };

            const { data: personalRatingData } = await supabase
                .from('personal_ratings')
                .select(
                    `user_id, raw_score, tags:personal_rating_tags(taste_tags(*))`
                )
                .eq('dish_type_id', dishId)
                .eq('restaurant_id', restaurantId);

            // Aggregate tags across all raters
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

            return {
                tags: flatTags,
                userRatingData: personalRatingData?.find(
                    (rating: any) => rating.user_id === user?.id
                ) as
                    | {
                          user_id: string;
                          raw_score: number;
                          tags: (TasteTag & { count: number })[];
                      }
                    | undefined,
            };
        },
        enabled: !!dishId && !!restaurantId,
    });
}

// ── Composite hook (preserves external API) ─────────────────────────────

/**
 * Hook to fetch dish details with reviews.
 * Returns split loading states so the UI can progressively render.
 */
export function useDishDetail(
    dishId: string | null,
    restaurantId: string | null
) {
    const core = useDishCore(dishId, restaurantId);
    const menu = useDishMenu(dishId, restaurantId);
    const ratings = useDishRatings(dishId, restaurantId);

    return {
        /** Primary data – renders the hero & stats immediately */
        core,
        /** Secondary – photo gallery / menu variations */
        menu,
        /** Secondary – taste tags & current user's rating */
        ratings,
    };
}
