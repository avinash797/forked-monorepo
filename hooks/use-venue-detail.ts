import { supabase } from '@/lib/supabase';
import type { DishWithVenue } from '@/types/browse';
import type { Dish, Venue } from '@/types/rating';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch venue details with all dishes
 * Used in: Venue detail screen
 */
export function useVenueDetail(venueId: string | null) {
    return useQuery({
        queryKey: ['venue', venueId],
        queryFn: async () => {
            if (!venueId) throw new Error('No venue ID provided');

            // Fetch venue
            const { data: venueData, error: venueError } = await supabase
                .from('venues')
                .select('*')
                .eq('id', venueId)
                .single();

            if (venueError) {
                throw new Error(venueError.message || 'Venue not found');
            }

            const venue = venueData as Venue;

            // Fetch all dishes for this venue
            // Sort by average rating (highest first), then by name
            const { data: dishesData, error: dishesError } = await supabase
                .from('dishes')
                .select(`*, reviews(photo_urls)`)
                .eq('venue_id', venueId)
                .eq('is_available', true)
                .order('average_rating', {
                    ascending: false,
                    nullsFirst: false,
                })
                .order('name');

            if (dishesError) {
                throw new Error(dishesError.message || 'Failed to load dishes');
            }

            // Add venue reference to dishes for consistency
            const dishes = (
                (dishesData || []) as Array<Dish & { reviews?: any[] }>
            ).map((dish) => {
                const reviewPhotos =
                    dish.reviews?.flatMap((r: any) => r.photo_urls || []) || [];
                return {
                    ...dish,
                    venue: venue,
                    photos: reviewPhotos, // Note: existing logic overwrites dish.photos with reviewPhotos?
                    // Looking at previous code: "const existingPhotos = dish.photos || [];" was NOT used in original code for this file?
                    // Wait, original code: "const reviewPhotos = dish.reviews?.flatMap... || []; return { ...dish, venue, photos: reviewPhotos }"
                    // Yes, it overwrites photos with reviewPhotos. It seems consistent with original implementation here.
                };
            }) as DishWithVenue[];

            const reviewPhotos = dishes.flatMap((d) => d.photos || []);

            return { venue, dishes, reviewPhotos };
        },
        enabled: !!venueId,
        select: (data) => data, // Pass through
    });
}
