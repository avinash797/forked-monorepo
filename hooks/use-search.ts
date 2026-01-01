import { supabase } from '@/lib/supabase';
import type { SearchResult } from '@/types/browse';
import type { Dish, Venue } from '@/types/rating';
import { useEffect, useState } from 'react';

/**
 * Hook to search dishes and venues globally
 * Used in: Search screen
 */
export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear results if query is too short
    if (query.length < 2) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Debounce search to avoid excessive API calls
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      // Create abort controller for canceling in-flight requests
      const abortController = new AbortController();

      try {
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
            `,
              { signal: abortController.signal } as any
            )
            .ilike('name', `%${query}%`)
            .eq('is_available', true)
            .limit(20),

          // Search venues by name or city
          supabase
            .from('venues')
            .select('*', { signal: abortController.signal } as any)
            .or(`name.ilike.%${query}%,address_city.ilike.%${query}%`)
            .limit(20),
        ]);

        // Handle errors
        if (dishesResult.error) throw dishesResult.error;
        if (venuesResult.error) throw venuesResult.error;

        // Combine results into discriminated union
        const dishResults: SearchResult[] = ((dishesResult.data || []) as Array<Dish & { review_photos: string[] }>).map(
          (dish) => {
            const reviewPhotos = dish.review_photos?.flatMap((r: any) => r.photo_urls || []) || [];
            return {
              type: 'dish' as const,
              data: {
                ...dish,
                photos: reviewPhotos,
              },
            };
          }
        );

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

        while (dishIndex < dishResults.length || venueIndex < venueResults.length) {
          // Add 2 dishes
          if (dishIndex < dishResults.length) {
            combined.push(dishResults[dishIndex++]);
          }
          if (dishIndex < dishResults.length) {
            combined.push(dishResults[dishIndex++]);
          }

          // Add 1 venue
          if (venueIndex < venueResults.length) {
            combined.push(venueResults[venueIndex++]);
          }
        }

        setResults(combined);
      } catch (err: any) {
        // Don't set error if request was aborted
        if (err.name !== 'AbortError') {
          setError(err.message || 'Search failed');
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }

      // Cleanup function: abort request if component unmounts or query changes
      return () => {
        abortController.abort();
      };
    }, 350); // 350ms debounce delay

    // Cleanup debounce timer
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [query]);

  return {
    results,
    isLoading,
    error,
  };
}
