import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Dish, CreateDishInput } from '@/types/rating';

export function useVenueDishes(venueId: string | null) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) {
      setDishes([]);
      return;
    }

    const fetchDishes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('dishes')
          .select('*')
          .eq('venue_id', venueId)
          .eq('is_available', true)
          .order('name');

        if (queryError) throw queryError;
        setDishes(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDishes();
  }, [venueId]);

  const refetch = () => {
    if (venueId) {
      setDishes([]);
    }
  };

  return { dishes, isLoading, error, refetch };
}

export function useCreateDish() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDish = async (input: CreateDishInput): Promise<Dish | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('dishes')
        .insert({
          ...input,
          currency: 'USD',
          added_by_user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createDish, isLoading, error };
}
