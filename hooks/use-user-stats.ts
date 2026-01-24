import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

// Type for get_user_stats RPC response
export interface UserStats {
    user_id: string;
    username: string | null;
    avatar_url: string | null;
    total_ratings: number;
    total_battles: number;
    cities_rated_in: number;
    dishes_by_type: { [key: string]: number };
    credibility_score: number;
    member_since: string;
    home_city: string | null;
    skip_rate: number;
}

// Type for get_my_best_ever RPC response
export interface BestEverDish {
    rating_id: string;
    dish_type_id: string;
    dish_type_name: string;
    dish_type_emoji: string;
    restaurant_id: string;
    restaurant_name: string;
    city_name: string;
    photo_url: string;
    raw_score: number;
    personal_elo: number;
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
            return data as UserStats | null;
        },
        enabled: enabled,
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
                .select('dish_type_id, dish_type:dish_types(id, name, emoji)')
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
                    count: number;
                }
            >();

            data.forEach((rating) => {
                const dishType = rating.dish_type as {
                    id: string;
                    name: string;
                    emoji: string;
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
                            count: 1,
                        });
                    }
                }
            });

            return Array.from(countMap.values()).sort(
                (a, b) => b.count - a.count
            );
        },
    });
}

/**
 * Get badges/achievements for a user
 * This is a placeholder - badges can be computed based on stats
 */
export function useUserBadges(userId?: string) {
    return useQuery({
        queryKey: ['userBadges', userId],
        queryFn: async () => {
            // Get user stats first
            const { data: stats, error } = await supabase.rpc(
                'get_user_stats',
                {
                    p_user_id: userId,
                }
            );

            if (error) throw error;
            if (!stats) return [];

            const userStats = stats as unknown as UserStats;
            const badges: Array<{
                id: string;
                name: string;
                description: string;
                emoji: string;
                earned: boolean;
            }> = [];

            // Founding Fork - early adopter badge (manual assignment for now)
            badges.push({
                id: 'founding_fork',
                name: 'Founding Fork',
                description: 'Early adopter who helped launch Forked',
                emoji: '🍴',
                earned: false, // Would need to check a separate table
            });

            // Rating milestones
            if (userStats.total_ratings >= 10) {
                badges.push({
                    id: 'first_ten',
                    name: 'Getting Started',
                    description: 'Rated 10 dishes',
                    emoji: '🌟',
                    earned: true,
                });
            }

            if (userStats.total_ratings >= 50) {
                badges.push({
                    id: 'fifty_ratings',
                    name: 'Foodie',
                    description: 'Rated 50 dishes',
                    emoji: '🍽️',
                    earned: true,
                });
            }

            if (userStats.total_ratings >= 100) {
                badges.push({
                    id: 'hundred_ratings',
                    name: 'Connoisseur',
                    description: 'Rated 100 dishes',
                    emoji: '👑',
                    earned: true,
                });
            }

            // Battle milestones
            if (userStats.total_battles >= 25) {
                badges.push({
                    id: 'battle_tested',
                    name: 'Battle Tested',
                    description: 'Completed 25 This vs That battles',
                    emoji: '⚔️',
                    earned: true,
                });
            }

            if (userStats.total_battles >= 100) {
                badges.push({
                    id: 'battle_master',
                    name: 'Battle Master',
                    description: 'Completed 100 This vs That battles',
                    emoji: '🏆',
                    earned: true,
                });
            }

            // Explorer badge
            if (userStats.cities_rated_in >= 3) {
                badges.push({
                    id: 'explorer',
                    name: 'Explorer',
                    description: 'Rated dishes in 3+ cities',
                    emoji: '🗺️',
                    earned: true,
                });
            }

            // Diverse palate
            if (Object.keys(userStats.dishes_by_type).length >= 5) {
                badges.push({
                    id: 'diverse_palate',
                    name: 'Diverse Palate',
                    description: 'Rated all 5 dish types',
                    emoji: '🎨',
                    earned: true,
                });
            }

            return badges;
        },
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
                .select('id, personal_elo, restaurant_id')
                .eq('user_id', userId)
                .eq('dish_type_id', dishTypeId)
                .order('personal_elo', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!userRatings || userRatings.length === 0) return null;

            // Get the leaderboard to find position
            const { data: leaderboard } = await supabase.rpc(
                'get_leaderboard_with_tiebreakers',
                {
                    p_city_id: cityId,
                    p_dish_type_id: dishTypeId,
                    p_limit: 100,
                }
            );

            if (!leaderboard) return null;

            const position = leaderboard.findIndex(
                (entry: { restaurant_id: string }) =>
                    entry.restaurant_id === userRatings[0].restaurant_id
            );

            return position >= 0 ? position + 1 : null;
        },
        enabled: !!userId && !!dishTypeId && !!cityId,
    });
}
