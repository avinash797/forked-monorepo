import { supabase } from '@/lib/supabase';
import type { DishWithVenue, ReviewWithUserProfile } from '@/types/browse';
import { Review } from '@/types/rating';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch dish details with reviews
 * Used in: Dish detail screen
 */
export function useDishDetail(dishId: string | null) {
    return useQuery({
        queryKey: ['dish', dishId],
        queryFn: async () => {
            if (!dishId) throw new Error('No dish ID provided');

            // Fetch dish and reviews in parallel
            const [dishResult, reviewsResult] = await Promise.all([
                // Fetch dish with venue info
                supabase
                    .from('dishes')
                    .select(
                        `
            *,
            venue:venues(*)
          `
                    )
                    .eq('id', dishId)
                    .single(),

                // Fetch reviews (without profile join - no direct FK exists)
                supabase
                    .from('reviews')
                    .select('*')
                    .eq('dish_id', dishId)
                    .eq('moderation_status', 'approved')
                    .order('helpful_votes_count', { ascending: false })
                    .order('created_at', { ascending: false }),
            ]);

            // Handle dish result
            if (dishResult.error) {
                throw new Error(dishResult.error.message || 'Dish not found');
            }
            const dish = dishResult.data as DishWithVenue;

            // Handle reviews result
            if (reviewsResult.error) {
                throw new Error(
                    reviewsResult.error.message || 'Failed to load reviews'
                );
            }

            const reviewsData: Review[] = reviewsResult.data || [];
            let reviews: ReviewWithUserProfile[] = [];

            // Fetch user profiles for all reviews separately
            if (reviewsData.length > 0) {
                const userIds = reviewsData.map((r) => r.user_id);
                const { data: profilesData } = await supabase
                    .from('users')
                    .select('id, username, display_name, avatar_url')
                    .in('id', userIds);

                // Map profiles to reviews
                const profilesMap = new Map(
                    (profilesData || []).map((p) => [p.id, p])
                );

                reviews = reviewsData.map((review) => ({
                    ...review,
                    profile: profilesMap.get(review.user_id) || null,
                }));
            }

            return { dish, reviews };
        },
        enabled: !!dishId,
    });
}
