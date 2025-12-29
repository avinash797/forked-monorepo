import { supabase } from '@/lib/supabase';
import type { DishWithVenue, ReviewWithUserProfile } from '@/types/browse';
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
        // Fetch dish and reviews in parallel for better performance
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

          // Fetch reviews with user profiles
          supabase
            .from('reviews')
            .select(
              `
              *,
              profile:profiles(username, display_name, profile_photo_url)
            `
            )
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
        setReviews((reviewsResult.data || []) as ReviewWithUserProfile[]);
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
