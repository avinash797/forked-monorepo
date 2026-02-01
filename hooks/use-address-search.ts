import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

// Use the key from env, preferring the PUBLIC prefix for client-side usage if available,
// but falling back to the one in .env.example
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const BASE_URL = 'https://places.googleapis.com/v1';

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
    google_place_id: string; // Added for reference
}

export interface GooglePlaceSuggestion {
    placePrediction: {
        placeId: string;
        text: {
            text: string;
        };
        structuredFormat: {
            mainText: {
                text: string;
            };
            secondaryText?: {
                text: string;
            };
        };
    };
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
            if (!debouncedQuery.trim() || !GOOGLE_API_KEY) return [];

            const requestBody: any = {
                input: debouncedQuery,
                includedPrimaryTypes: [
                    'food',
                    'restaurant',
                    'cafe',
                    'bar',
                    'bakery',
                ],
            };

            if (options?.proximity) {
                requestBody.locationBias = {
                    circle: {
                        center: {
                            latitude: options.proximity.latitude,
                            longitude: options.proximity.longitude,
                        },
                        radius: 5000, // 5km bias
                    },
                };
            }

            const response = await fetch(`${BASE_URL}/places:autocomplete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                },
                body: JSON.stringify(requestBody),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Google Places API error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            return (data.suggestions || []) as GooglePlaceSuggestion[];
        },
        enabled: !!debouncedQuery.trim() && !!GOOGLE_API_KEY,
    });

    // Details Mutation
    const {
        mutateAsync: selectAddress,
        isPending: isSelecting,
        error: selectError,
    } = useMutation({
        mutationFn: async (placeId: string): Promise<AddressData> => {
            if (!GOOGLE_API_KEY)
                throw new Error('Google Maps API Key not configured');

            const response = await fetch(`${BASE_URL}/places/${placeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask':
                        'id,displayName,formattedAddress,addressComponents,location',
                },
            });

            if (!response.ok) {
                throw new Error(`Google Places API error: ${response.status}`);
            }

            const data = await response.json();

            // Map Google Address Components to our structure
            // addressComponents is an array of { longText, shortText, types: string[] }
            const components = data.addressComponents || [];

            const getComponent = (type: string) =>
                components.find((c: any) => c.types.includes(type))?.longText ||
                '';
            const getShortComponent = (type: string) =>
                components.find((c: any) => c.types.includes(type))
                    ?.shortText || '';

            const streetNumber = getComponent('street_number');
            const route = getComponent('route');
            const street = [streetNumber, route]
                .filter(Boolean)
                .join(' ')
                .trim();

            const city =
                getComponent('locality') ||
                getComponent('sublocality') ||
                getComponent('administrative_area_level_2'); // fallback
            const state = getShortComponent('administrative_area_level_1');
            const zip = getComponent('postal_code');
            const country = getShortComponent('country');

            return {
                name: data.displayName?.text || street || data.formattedAddress,
                full_address: data.formattedAddress,
                street: street || data.displayName?.text || '',
                city,
                state,
                zip,
                country,
                latitude: data.location?.latitude || 0,
                longitude: data.location?.longitude || 0,
                google_place_id: data.id,
            };
        },
    });

    const clearSearch = useCallback(() => {
        setQuery('');
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
        clearSearch,
    };
}
