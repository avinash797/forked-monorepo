import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/auth';
import type { DishWithVenue, ReviewWithUserProfile } from '@/types/browse';
import { Review } from '@/types/rating';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch dish details with reviews
 * Used in: Dish detail screen
 */
export function useDishDetail(dishId: string | null) {
  const [dish, setDish] = useState<DishWithVenue | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dishId) {
      setDish(null);
      setReviews([]);
      return;
    }

    const fetchDishAndReviews = async () => {
      setIsLoading(true);
      setError(null);

      try {
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
        setDish(dishResult.data as DishWithVenue);

        // Handle reviews result
        if (reviewsResult.error) {
          throw new Error(reviewsResult.error.message || 'Failed to load reviews');
        }

        const reviewsData: Review[] = reviewsResult.data || [];

        // Fetch user profiles for all reviews separately
        if (reviewsData.length > 0) {
          const userIds = reviewsData.map((r) => r.user_id);
          const { data: profilesData } = await supabase
            .from('users')
            .select('id, username, display_name, profile_photo_url')
            .in('id', userIds);

          // Map profiles to reviews
          const profilesMap = new Map<string, Profile>(
            (profilesData || [] as Profile[]).map((p) => [p.id, p])
          );

          const reviewsWithProfiles = reviewsData.map((review) => ({
            ...review,
            profile: profilesMap.get(review.user_id) || null,
          }));

          setReviews(reviewsWithProfiles as ReviewWithUserProfile[]);
        } else {
          setReviews([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dish details');
        setDish(null);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDishAndReviews();
  }, [dishId]);

  return {
    dish,
    reviews,
    isLoading,
    error,
  };
}
