import { supabase } from '@/lib/supabase';
import type { DishWithVenue } from '@/types/browse';
import type { Dish, Venue } from '@/types/rating';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch venue details with all dishes
 * Used in: Venue detail screen
 */
export function useVenueDetail(venueId: string | null) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [dishes, setDishes] = useState<DishWithVenue[]>([]);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) {
      setVenue(null);
      setDishes([]);
      setReviewPhotos([]);
      return;
    }

    const fetchVenueAndDishes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch venue
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('*')
          .eq('id', venueId)
          .single();

        if (venueError) {
          throw new Error(venueError.message || 'Venue not found');
        }

        setVenue(venueData as Venue);

        // Fetch all dishes for this venue
        // Sort by average rating (highest first), then by name
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select(`*, reviews(photo_urls)`)
          .eq('venue_id', venueId)
          .eq('is_available', true)
          .order('average_rating', { ascending: false, nullsFirst: false })
          .order('name');

        if (dishesError) {
          throw new Error(dishesError.message || 'Failed to load dishes');
        }

        // Add venue reference to dishes for consistency
        const dishesWithVenue = ((dishesData || []) as Array<Dish & { reviews?: any[] }>).map((dish) => {
          const reviewPhotos = dish.reviews?.flatMap((r: any) => r.photo_urls || []) || [];
          return {
            ...dish,
            venue: venueData,
            photos: reviewPhotos,
          };
        }) as DishWithVenue[];

        setDishes(dishesWithVenue);

        const photos = (dishesWithVenue || [])
          .flatMap((d) => d.photos || []);

        setReviewPhotos(photos);
      } catch (err: any) {
        setError(err.message || 'Failed to load venue details');
        setVenue(null);
        setDishes([]);
        setReviewPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenueAndDishes();
  }, [venueId]);

  return {
    venue,
    dishes,
    reviewPhotos,
    isLoading,
    error,
  };
}
