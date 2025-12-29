import { supabase } from '@/lib/supabase';
import type { DishWithVenue, TopDishesFilters } from '@/types/browse';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch top-rated dishes with pagination
 * Used in: Home feed screen
 */
export function useTopDishes(filters: TopDishesFilters = {}) {
  const [dishes, setDishes] = useState<DishWithVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = filters.limit || 20;

  const fetchDishes = async (resetData = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = resetData ? 0 : offset;

      // Build query
      let query = supabase
        .from('dishes')
        .select(
          `
          *,
          venue:venues(*)
        `,
          { count: 'exact' }
        )
        .not('average_rating', 'is', null)
        .eq('is_available', true)
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
      query = query.range(currentOffset, currentOffset + limit - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      const newDishes = (data || []) as DishWithVenue[];

      if (resetData) {
        setDishes(newDishes);
        setOffset(limit);
      } else {
        setDishes((prev) => [...prev, ...newDishes]);
        setOffset((prev) => prev + limit);
      }

      // Check if there are more results
      if (count !== null) {
        setHasMore(currentOffset + newDishes.length < count);
      } else {
        // Fallback: if we got fewer results than limit, assume no more
        setHasMore(newDishes.length === limit);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dishes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchDishes(false);
    }
  };

  const refetch = () => {
    setOffset(0);
    fetchDishes(true);
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.city, filters.minRating, filters.dish_type_id]);

  return {
    dishes,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
