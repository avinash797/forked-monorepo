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
export function useRecentBattles(
    options: { limit?: number; cityId?: string } = {}
) {
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
                    result,
                    user:profiles!comparisons_user_profile_fkey (
                        display_name
                    ),
                    dish_type:dish_types(
                        name,
                        emoji
                    ),
                    new_rating:personal_ratings!comparisons_new_rating_id_fkey(
                        id,
                        restaurant:restaurants(name)
                    ),
                    opponent_rating:personal_ratings!comparisons_opponent_rating_id_fkey(
                        id,
                        restaurant:restaurants(name)
                    )
                `
                )
                .in('result', ['new_wins', 'opponent_wins']) // Only show decided battles
                .order('created_at', { ascending: false })
                .limit(limit);

            const { data, error } = await query;

            if (error) throw error;

            // Transform data to RecentBattleItem format
            const battles: RecentBattleItem[] = (data || [])
                .filter((item) => item.user && item.dish_type) // Filter out incomplete data
                .map((item) => {
                    const newRating = (item as any).new_rating;
                    const opponentRating = (item as any).opponent_rating;

                    // result = 'new_wins' → new_rating is winner, else opponent_rating is winner
                    const winnerRestaurant = item.result === 'new_wins'
                        ? newRating?.restaurant?.name || 'Unknown'
                        : opponentRating?.restaurant?.name || 'Unknown';
                    const loserRestaurant = item.result === 'new_wins'
                        ? opponentRating?.restaurant?.name || 'Unknown'
                        : newRating?.restaurant?.name || 'Unknown';

                    return {
                        id: item.id,
                        username:
                            (item.user as any)?.display_name || 'Anonymous',
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
