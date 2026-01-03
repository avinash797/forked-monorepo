import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

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
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sessionToken] = useState(() => generateUUID());

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Suggestions Query
    const {
        data: suggestions = [],
        isLoading: isSearching,
        error: searchError,
    } = useQuery({
        queryKey: ['address-search', debouncedQuery, options?.proximity],
        queryFn: async ({ signal }) => {
            if (!debouncedQuery.trim() || !MAPBOX_TOKEN) return [];

            const params: Record<string, string> = {
                q: debouncedQuery,
                access_token: MAPBOX_TOKEN,
                session_token: sessionToken,
                country: 'US',
                language: 'en',
                types: 'address,poi',
                poi_category: 'restaurant,food,food and drink',
                limit: '5',
            };

            if (options?.proximity) {
                params.proximity = `${options.proximity.longitude},${options.proximity.latitude}`;
            }

            const urlParams = new URLSearchParams(params);
            const response = await fetch(
                `${SUGGEST_URL}?${urlParams.toString()}`,
                { signal }
            );

            if (!response.ok) {
                throw new Error(`Mapbox API error: ${response.status}`);
            }

            const data = await response.json();
            return (data.suggestions || []) as MapboxSuggestion[];
        },
        enabled: !!debouncedQuery.trim() && !!MAPBOX_TOKEN,
    });

    // Details Mutation
    const {
        mutateAsync: selectAddress,
        isPending: isSelecting,
        error: selectError,
    } = useMutation({
        mutationFn: async (suggestionId: string): Promise<AddressData> => {
            if (!MAPBOX_TOKEN) throw new Error('Mapbox token not configured');

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

            const streetNumber = context.address?.address_number || '';
            const streetName = context.address?.street_name || '';
            const street = [streetNumber, streetName]
                .filter(Boolean)
                .join(' ')
                .trim();
            const city = context.place?.name || '';
            const state = context.region?.region_code || '';
            const zip = context.postcode?.name || '';
            const country =
                context.country?.country_code?.toUpperCase() || 'USA';

            return {
                name: properties.name,
                full_address: properties.full_address,
                street: street || properties.name,
                city,
                state,
                zip,
                country,
                latitude,
                longitude,
            };
        },
    });

    const clearSearch = useCallback(() => {
        setQuery('');
    }, []);

    const searchAddress = useCallback((newQuery: string) => {
        setQuery(newQuery);
        return Promise.resolve([]); // Breaking change: No longer returns immediate results
    }, []);

    const error =
        (searchError as Error)?.message ||
        (selectError as Error)?.message ||
        null;

    return {
        query,
        setQuery,
        suggestions,
        loading: isSearching || isSelecting,
        error,
        selectAddress,
        searchAddress,
        clearSearch,
    };
}
