import { supabase } from '@/lib/supabase';
import type { DishWithVenue, TopDishesFilters } from '@/types/browse';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook to fetch top-rated dishes with pagination
 * Used in: Home feed screen
 */
export function useTopDishes(filters: TopDishesFilters = {}) {
    const limit = filters.limit || 20;

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isPending,
        isFetchingNextPage,
        refetch,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ['top-dishes', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 2);

            let query = supabase
                .from('dishes')
                .select(
                    `
          *,
          venue:venues(*),
          reviews(photo_urls)
        `,
                    { count: 'exact' }
                )
                .not('average_rating', 'is', null)
                .eq('is_available', true)
                .gte('updated_at', oneWeekAgo.toISOString())
                .order('average_rating', { ascending: false });

            // Apply filters
            if (filters.city) {
                query = query.eq('venues.address_city', filters.city);
            }

            if (filters.minRating) {
                query = query.gte('average_rating', filters.minRating);
            }

            if (filters.dish_type_id) {
                query = query.eq('dish_type_id', filters.dish_type_id);
            }

            // Apply pagination
            query = query.range(pageParam, pageParam + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform data to flatten review photos into the main photos array
            const newDishes = (data || []).map((dish: any) => {
                const reviewPhotos =
                    dish.reviews?.flatMap((r: any) => r.photo_urls || []) || [];
                const existingPhotos = dish.photos || [];

                // Combine existing photos with review photos, removing duplicates if any
                const allPhotos = Array.from(
                    new Set([...existingPhotos, ...reviewPhotos])
                );

                return {
                    ...dish,
                    photos: allPhotos,
                };
            }) as DishWithVenue[];

            return newDishes;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < limit) return undefined;
            return allPages.length * limit;
        },
    });

    const dishes = useMemo(() => data?.pages.flat() || [], [data]);

    return {
        dishes,
        isLoading: isPending || isFetchingNextPage, // Maintain existing behavior where loading state is true during pagination
        error: error ? (error as Error).message : null,
        hasMore: hasNextPage,
        loadMore: () => {
            if (!isFetchingNextPage && hasNextPage) {
                fetchNextPage();
            }
        },
        refetch,
    };
}
