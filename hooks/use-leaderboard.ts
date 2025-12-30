import { supabase } from '@/lib/supabase';
import type { DishTypeForLeaderboard, LeaderboardItem } from '@/types/browse';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch dish types and leaderboard items for the leaderboard screen
 *
 * Features:
 * - Fetches dish types with at least 3 rated dishes
 * - Fetches top dishes by average rating for selected dish type
 * - Assigns ranks and medals to top 3 dishes
 */
export function useLeaderboard() {
  const [dishTypes, setDishTypes] = useState<DishTypeForLeaderboard[]>([]);
  const [selectedDishTypeId, setSelectedDishTypeId] = useState<string | null>(null);
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [isLoadingDishTypes, setIsLoadingDishTypes] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dish types that have at least 3 dishes with ratings
   */
  const fetchDishTypes = async () => {
    setIsLoadingDishTypes(true);
    setError(null);

    try {
      // Step 1: Get all dish used in rated dishes
      // We select only the dish_type_id to minimize data transfer
      const { data: usageData, error: usageError } = await supabase
        .from('dishes')
        .select('dish_type_id')
        .not('average_rating', 'is', null)
        .eq('is_available', true);

      if (usageError) throw usageError;

      // Step 2: Aggregate counts in memory
      const counts: Record<string, number> = {};
      const items = usageData as unknown as { dish_type_id: string }[] | null;
      (items || []).forEach((item) => {
        if (item.dish_type_id) {
          counts[item.dish_type_id] = (counts[item.dish_type_id] || 0) + 1;
        }
      });

      // Step 3: Filter for IDs with >= 3 dishes
      const validIds = Object.keys(counts).filter((id) => counts[id] >= 3);

      if (validIds.length === 0) {
        setDishTypes([]);
        return;
      }

      // Step 4: Fetch details for these dish types
      const { data: validDishTypes, error: typesError } = await supabase
        .from('dish_types')
        .select('id, name, category')
        .in('id', validIds)
        .order('name', { ascending: true });

      if (typesError) throw typesError;

      // Step 5: Combine data with counts
      const qualifiedDishTypes: DishTypeForLeaderboard[] = ((validDishTypes || []) as DishTypeForLeaderboard[]).map((dt) => ({
        ...dt,
        rated_dish_count: counts[dt.id],
      }));

      setDishTypes(qualifiedDishTypes);

      // Auto-select first dish type if available and none selected
      if (qualifiedDishTypes.length > 0 && !selectedDishTypeId) {
        setSelectedDishTypeId(qualifiedDishTypes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dish types');
    } finally {
      setIsLoadingDishTypes(false);
    }
  };

  /**
   * Fetch leaderboard items for the selected dish type
   */
  const fetchLeaderboard = async (dishTypeId: string) => {
    setIsLoadingLeaderboard(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('dishes')
        .select(
          `
          *,
          venue:venues(*),
          review_photos:reviews(photo_urls)
        `
        )
        .eq('dish_type_id', dishTypeId)
        .not('average_rating', 'is', null)
        .eq('is_available', true)
        .order('average_rating', { ascending: false })
        .limit(50); // Top 50 items

      if (queryError) throw queryError;

      // Transform data to leaderboard items with ranks and medals
      const items: LeaderboardItem[] = (data || []).map((dish: any, index: number) => {
        const rank = index + 1;
        let medal: 'gold' | 'silver' | 'bronze' | undefined;

        if (rank === 1) medal = 'gold';
        else if (rank === 2) medal = 'silver';
        else if (rank === 3) medal = 'bronze';
        const reviewPhotos = dish.review_photos?.flatMap((r: any) => r.photo_urls || []) || [];

        return {
          rank,
          dish: {
            id: dish.id,
            venue_id: dish.venue_id,
            name: dish.name,
            category: dish.category,
            variety: dish.variety,
            current_price: dish.current_price,
            currency: dish.currency,
            description: dish.description,
            dietary_tags: dish.dietary_tags,
            spice_level: dish.spice_level,
            photos: reviewPhotos,
            is_available: dish.is_available,
            date_added: dish.date_added,
            updated_at: dish.updated_at,
            added_by_user_id: dish.added_by_user_id,
            dish_type_id: dish.dish_type_id,
            average_rating: dish.average_rating,
            review_count: dish.review_count,
          },
          venue: dish.venue,
          medal,
        };
      });

      setLeaderboardItems(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  /**
   * Change selected dish type and refetch leaderboard
   */
  const selectDishType = (dishTypeId: string) => {
    setSelectedDishTypeId(dishTypeId);
  };

  /**
   * Refresh all data
   */
  const refetch = () => {
    fetchDishTypes();
    if (selectedDishTypeId) {
      fetchLeaderboard(selectedDishTypeId);
    }
  };

  // Fetch dish types on mount
  useEffect(() => {
    fetchDishTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch leaderboard when dish type changes
  useEffect(() => {
    if (selectedDishTypeId) {
      fetchLeaderboard(selectedDishTypeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDishTypeId]);

  return {
    dishTypes,
    selectedDishTypeId,
    leaderboardItems,
    isLoadingDishTypes,
    isLoadingLeaderboard,
    error,
    selectDishType,
    refetch,
  };
}
