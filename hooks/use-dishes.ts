import { supabase } from '@/lib/supabase';
import type { CreateDishInput, Dish, DishType } from '@/types/rating';
import { useEffect, useState } from 'react';

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
        } as any)
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

export function useDishTypes() {
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDishTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('dish_types')
          .select('*')
          .order('name');

        if (queryError) throw queryError;
        setDishTypes(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDishTypes();
  }, []);

  return { dishTypes, isLoading, error };
}
