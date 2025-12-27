import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Venue, CreateVenueInput } from '@/types/rating';

export function useVenueSearch(query: string) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setVenues([]);
      return;
    }

    const searchVenues = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('venues')
          .select('*')
          .or(`name.ilike.%${query}%,address_city.ilike.%${query}%`)
          .order('name')
          .limit(20);

        if (queryError) throw queryError;
        setVenues(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchVenues, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { venues, isLoading, error };
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
