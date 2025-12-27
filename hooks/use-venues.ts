import { supabase } from '@/lib/supabase';
import type { CreateVenueInput, Venue } from '@/types/rating';
import { useEffect, useState } from 'react';

export function useVenueSearch(initialQuery: string = '') {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVenues = async (searchQuery: string): Promise<Venue[]> => {
    if (!searchQuery || searchQuery.length < 2) {
      setVenues([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('venues')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,address_city.ilike.%${searchQuery}%`)
        .order('name')
        .limit(20);

      if (queryError) throw queryError;

      const results = data || [];
      setVenues(results);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchVenues(initialQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [initialQuery]);

  const getNearbyVenues = async (): Promise<Venue[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('venues')
        .select('*')
        .limit(50);

      if (queryError) throw queryError;

      const results = data || [];
      // We don't overwrite search state "venues" here to avoid confusing the search UI state, 
      // or we can? The UI separates dbVenues state. 
      // Let's just return the data.
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { venues, isLoading, error, searchVenues, getNearbyVenues };
}

export function useCreateVenue() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVenue = async (input: CreateVenueInput): Promise<Venue | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('venues')
        .insert({
          ...input,
          added_by_user_id: user.id,
          is_chain: false,
          parent_chain_id: null,
          hours_of_operation: {},
          photos: [],
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

  return { createVenue, isLoading, error };
}
