import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry, UserStatsResponse } from '@/types/rpc.types';
import { useQuery } from '@tanstack/react-query';

// Re-export for backward compatibility (hook moved to use-badges.ts)
export { useUserBadges } from './use-badges';

// Re-export for backward compatibility
export type UserStats = UserStatsResponse;

// Type for get_my_best_ever RPC response
export interface BestEverDish {
    rating_id: string;
    dish_type_id: string;
    dish_type_name: string;
    dish_type_emoji: string;
    dish_type_icon?: string | null;
    restaurant_id: string;
    restaurant_name: string;
    city_name: string;
    neighborhood_name?: string | null;
    variation_name?: string | null;
    photo_url: string;
    derived_score: number;
    sentiment: 'liked' | 'okay' | 'disliked';
    rated_at: string;
}

/**
 * Get user stats for the current user or a specific user
 */
export function useUserStats(userId?: string, enabled?: boolean) {
    return useQuery({
        queryKey: ['userStats', userId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_user_stats', {
                p_user_id: userId,
            });

            if (error) throw error;
            return data as unknown as UserStatsResponse | null;
        },
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get user's "Best Ever" dishes - their top-rated dish per category
 */
export function useMyBestEver(userId?: string) {
    return useQuery({
        queryKey: ['myBestEver', userId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_my_best_ever', {
                p_user_id: userId,
            });

            if (error) throw error;
            return (data ?? []) as BestEverDish[];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get user's profile data
 */
export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            // If no userId provided, get current user's profile
            let targetUserId = userId;

            if (!targetUserId) {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                targetUserId = user?.id;
            }

            if (!targetUserId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select(
                    `
                    *,
                    home_city:cities(id, name, state)
                `
                )
                .eq('id', targetUserId)
                .single();

            if (error) throw error;
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get dish type breakdown for a user's ratings
 */
export function useRatingsByDishType(userId?: string) {
    return useQuery({
        queryKey: ['ratingsByDishType', userId],
        queryFn: async () => {
            // Get current user if not specified
            let targetUserId = userId;

            if (!targetUserId) {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                targetUserId = user?.id;
            }

            if (!targetUserId) return [];

            // Get count of ratings per dish type
            const { data, error } = await supabase
                .from('personal_ratings')
                .select('dish_type_id, dish_type:dish_types(id, name, emoji, icon)')

                .eq('user_id', targetUserId);

            if (error) throw error;
            if (!data) return [];

            // Group by dish type and count
            const countMap = new Map<
                string,
                {
                    dish_type_id: string;
                    name: string;
                    emoji: string;
                    icon: string | null;
                    count: number;
                }

            >();

            data.forEach((rating) => {
                const dishType = rating.dish_type as {
                    id: string;
                    name: string;
                    emoji: string;
                    icon: string | null;
                } | null;

                if (dishType) {
                    const existing = countMap.get(dishType.id);
                    if (existing) {
                        existing.count++;
                    } else {
                        countMap.set(dishType.id, {
                            dish_type_id: dishType.id,
                            name: dishType.name,
                            emoji: dishType.emoji,
                            icon: dishType.icon,
                            count: 1,
                        });

                    }
                }
            });

            return Array.from(countMap.values()).sort(
                (a, b) => b.count - a.count
            );
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get the leaderboard position for a user for a specific dish type
 */
export function useUserLeaderboardPosition(
    userId: string | undefined,
    dishTypeId: string | null,
    cityId: string | null
) {
    return useQuery({
        queryKey: ['userLeaderboardPosition', userId, dishTypeId, cityId],
        queryFn: async () => {
            if (!userId || !dishTypeId || !cityId) return null;

            // Get user's best rating for this dish type
            const { data: userRatings, error } = await supabase
                .from('personal_ratings')
                .select('id, derived_score, restaurant_id')
                .eq('user_id', userId)
                .eq('dish_type_id', dishTypeId)
                .order('derived_score', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!userRatings || userRatings.length === 0) return null;

            // Get the leaderboard to find position
            const { data: leaderboard } = await supabase.rpc(
                'get_leaderboard',
                {
                    p_city_id: cityId,
                    p_dish_type_id: dishTypeId,
                    p_limit: 100,
                }
            );

            if (!leaderboard) return null;

            const entries = leaderboard as unknown as LeaderboardEntry[];
            const position = entries.findIndex(
                (entry) => entry.restaurant_id === userRatings[0].restaurant_id
            );

            return position >= 0 ? position + 1 : null;
        },
        enabled: !!userId && !!dishTypeId && !!cityId,
    });
}
