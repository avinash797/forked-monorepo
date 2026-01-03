import { supabase } from '@/lib/supabase';
import type { SearchResult } from '@/types/browse';
import type { Venue } from '@/types/rating';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Hook to search dishes and venues globally
 * Used in: Search screen
 */
export function useSearch(query: string) {
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 350);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    return useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async ({ signal }): Promise<SearchResult[]> => {
            if (debouncedQuery.length < 2) {
                return [];
            }

            // Search dishes and venues in parallel
            const [dishesResult, venuesResult] = await Promise.all([
                // Search dishes by name
                supabase
                    .from('dishes')
                    .select(
                        `
            *,
            venue:venues(name, address_city, address_state),
            review_photos:reviews(photo_urls)
          `
                    )
                    .ilike('name', `%${debouncedQuery}%`)
                    .eq('is_available', true)
                    .limit(20)
                    .abortSignal(signal),

                // Search venues by name or city
                supabase
                    .from('venues')
                    .select('*')
                    .or(
                        `name.ilike.%${debouncedQuery}%,address_city.ilike.%${debouncedQuery}%`
                    )
                    .limit(20)
                    .abortSignal(signal),
            ]);

            // Handle errors
            if (dishesResult.error) throw dishesResult.error;
            if (venuesResult.error) throw venuesResult.error;

            // Combine results into discriminated union
            const dishResults = (dishesResult.data || []).map((dish) => {
                const reviewPhotos =
                    dish.review_photos?.flatMap(
                        (r: any) => r.photo_urls || []
                    ) || [];
                return {
                    type: 'dish' as const,
                    data: {
                        ...dish,
                        photos: reviewPhotos,
                    },
                };
            });

            const venueResults: SearchResult[] = (venuesResult.data || []).map(
                (venue) => ({
                    type: 'venue' as const,
                    data: venue as Venue,
                })
            );

            // Interleave results for better UX
            // Pattern: dish, dish, venue, dish, dish, venue...
            const combined: SearchResult[] = [];
            let dishIndex = 0;
            let venueIndex = 0;

            while (
                dishIndex < dishResults.length ||
                venueIndex < venueResults.length
            ) {
                // Add 2 dishes
                if (dishIndex < dishResults.length) {
                    combined.push(dishResults[dishIndex++] as any);
                }
                if (dishIndex < dishResults.length) {
                    combined.push(dishResults[dishIndex++] as any);
                }

                // Add 1 venue
                if (venueIndex < venueResults.length) {
                    combined.push(venueResults[venueIndex++]);
                }
            }

            return combined;
        },
        enabled: debouncedQuery.length >= 2,
        placeholderData: (previousData) => previousData, // Keep previous results while fetching new ones
    });
}
