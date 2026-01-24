import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Recent battle item showing a user's comparison action
 * Represents: "User123 picked **Parkway** over **Domilise's** (Po'boy)"
 */
export interface RecentBattleItem {
    id: string;
    username: string;
    dishTypeName: string;
    dishTypeEmoji: string;
    winnerRestaurant: string;
    loserRestaurant: string;
    createdAt: string;
}

/**
 * Hook to fetch recent community battles (global comparisons)
 * Shows real-time activity to validate the "Authority Engine" is active
 *
 * Used in: RecentBattleTicker component on Home screen
 *
 * @example
 * ```tsx
 * const { battles, isLoading } = useRecentBattles({ limit: 10 });
 * ```
 */
export function useRecentBattles(options: { limit?: number; cityId?: string } = {}) {
    const { limit = 15, cityId } = options;

    return useQuery({
        queryKey: ['recent-battles', limit, cityId],
        queryFn: async () => {
            let query = supabase
                .from('comparisons')
                .select(
                    `
                    id,
                    created_at,
                    user:user_id (
                        username
                    ),
                    dish_type:dish_types(
                        name,
                        emoji
                    ),
                    winner:winner_rating_id (
                        restaurant:restaurants(name)
                    ),
                    rating_a:personal_ratings!comparisons_rating_a_id_fkey(
                        id,
                        restaurant:restaurants(name)
                    ),
                    rating_b:personal_ratings!comparisons_rating_b_id_fkey(
                        id,
                        restaurant:restaurants(name)
                    )
                `
                )
                .not('winner_rating_id', 'is', null) // Only show actual battles, not skips
                .order('created_at', { ascending: false })
                .limit(limit);

            const { data, error } = await query;

            if (error) throw error;

            // Transform data to RecentBattleItem format
            const battles: RecentBattleItem[] = (data || [])
                .filter((item) => item.user && item.dish_type && item.winner) // Filter out incomplete data
                .map((item) => {
                    const winnerRestaurant = (item.winner as any)?.restaurant?.name || 'Unknown';

                    // Determine loser restaurant
                    const ratingA = item.rating_a as any;
                    const ratingB = item.rating_b as any;
                    const loserRestaurant =
                        (item.winner as any)?.restaurant?.name === ratingA?.restaurant?.name
                            ? ratingB?.restaurant?.name || 'Unknown'
                            : ratingA?.restaurant?.name || 'Unknown';

                    return {
                        id: item.id,
                        username: (item.user as any)?.username || 'Anonymous',
                        dishTypeName: (item.dish_type as any)?.name || 'Dish',
                        dishTypeEmoji: (item.dish_type as any)?.emoji || '🍽️',
                        winnerRestaurant,
                        loserRestaurant,
                        createdAt: item.created_at || new Date().toISOString(),
                    };
                }) as RecentBattleItem[];

            return battles;
        },
        // Refetch every 30 seconds to show live activity
        refetchInterval: 30000,
        staleTime: 20000,
    });
}
