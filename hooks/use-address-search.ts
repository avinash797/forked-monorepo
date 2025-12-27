import { useCallback, useEffect, useRef, useState } from 'react';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

export interface AddressData {
  name: string;
  full_address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface MapboxSuggestion {
  mapbox_id: string;
  name: string;
  full_address: string;
}

interface MapboxFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;
    full_address: string;
    context: {
      address?: {
        street_name?: string;
        address_number?: string;
      };
      postcode?: {
        name?: string;
      };
      place?: {
        name?: string;
      };
      region?: {
        region_code?: string;
        name?: string;
      };
      country?: {
        country_code?: string;
        name?: string;
      };
    };
  };
}

// Generate a UUID v4 for session tokens
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UseAddressSearchOptions {
  proximity?: {
    longitude: number;
    latitude: number;
  } | null;
}

export function useAddressSearch(options?: UseAddressSearchOptions) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useState(() => generateUUID());

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Search function that returns a promise
  const searchAddress = useCallback(
    async (searchQuery: string): Promise<MapboxSuggestion[]> => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setError(null);
        return [];
      }

      if (!MAPBOX_TOKEN) {
        const msg = 'Mapbox token not configured';
        setError(msg);
        return [];
      }

      // Abort previous request if still pending
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {
          q: searchQuery,
          access_token: MAPBOX_TOKEN,
          session_token: sessionToken,
          country: 'US',
          language: 'en',
          types: 'address,poi',
          poi_category: 'restaurant, food, hospitality',
          limit: '5',
        };

        // Add proximity bias if user location is available
        if (options?.proximity) {
          params.proximity = `${options.proximity.longitude},${options.proximity.latitude}`;
        }

        const urlParams = new URLSearchParams(params);
        const response = await fetch(`${SUGGEST_URL}?${urlParams.toString()}`, {
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.status}`);
        }

        const data = await response.json();
        const results = data.suggestions || [];

        setSuggestions(results);
        setLoading(false);
        return results;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Address search error:', err);
          setError('Failed to search addresses. Please try again.');
          setSuggestions([]);
          setLoading(false);
        }
        return [];
      }
    },
    [sessionToken, options?.proximity]
  );

  // Debounce the search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only auto-search if query is set via setQuery (for backward compatibility if needed)
    // But now we prefer manual calling of searchAddress
    if (query) {
      debounceTimer.current = setTimeout(() => {
        searchAddress(query);
      }, 300);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, searchAddress]);

  // Select an address and retrieve full details
  const selectAddress = useCallback(
    async (suggestionId: string): Promise<AddressData | null> => {
      if (!MAPBOX_TOKEN) {
        setError('Mapbox token not configured');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          session_token: sessionToken,
        });

        const response = await fetch(
          `${RETRIEVE_URL}/${suggestionId}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.status}`);
        }

        const data = await response.json();
        const feature: MapboxFeature = data.features?.[0];

        if (!feature) {
          throw new Error('No address details found');
        }

        const { geometry, properties } = feature;
        const [longitude, latitude] = geometry.coordinates;
        const { context } = properties;

        // Extract address components from context
        const streetNumber = context.address?.address_number || '';
        const streetName = context.address?.street_name || '';
        const street = [streetNumber, streetName].filter(Boolean).join(' ').trim();
        const city = context.place?.name || '';
        const state = context.region?.region_code || '';
        const zip = context.postcode?.name || '';
        const country = context.country?.country_code?.toUpperCase() || 'USA';

        const addressData: AddressData = {
          name: properties.name,
          full_address: properties.full_address,
          street: street || properties.name, // Fallback to name if no street
          city,
          state,
          zip,
          country,
          latitude,
          longitude,
        };

        setLoading(false);
        return addressData;
      } catch (err: any) {
        console.error('Address retrieval error:', err);
        setError('Failed to retrieve address details. Please try again.');
        setLoading(false);
        return null;
      }
    },
    [sessionToken]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    selectAddress,
    searchAddress, // Export this
    clearSearch,
  };
}
