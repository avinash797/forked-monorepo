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
    neighborhood: string;
    latitude: number;
    longitude: number;
    google_place_id: string; // Added for reference
    phone: string;
    website: string;
    types: string[];
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

interface UsePlacesSearchReturn {
    query: string;
    setQuery: (query: string) => void;
    suggestions: GooglePlaceSuggestion[];
    loading: boolean;
    error: string | null;
    selectAddress: (placeId: string) => Promise<AddressData>;
    clearSearch: () => void;
}

interface UseNearbyGooglePlacesOptions {
    latitude: number | null;
    longitude: number | null;
    radiusMeters?: number;
    maxResults?: number;
}

export function useNearbyGooglePlaces(options: UseNearbyGooglePlacesOptions) {
    const {
        latitude,
        longitude,
        radiusMeters = 1000,
        maxResults = 10,
    } = options;

    return useQuery({
        queryKey: [
            'google-nearby-places',
            latitude,
            longitude,
            radiusMeters,
            maxResults,
        ],
        queryFn: async ({ signal }): Promise<GooglePlaceSuggestion[]> => {
            if (!latitude || !longitude || !GOOGLE_API_KEY) return [];

            const response = await fetch(`${BASE_URL}/places:searchNearby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask':
                        'places.id,places.displayName,places.formattedAddress',
                },
                body: JSON.stringify({
                    includedTypes: ['restaurant', 'cafe', 'bar', 'bakery'],
                    maxResultCount: maxResults,
                    locationRestriction: {
                        circle: {
                            center: { latitude, longitude },
                            radius: radiusMeters,
                        },
                    },
                }),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Google Nearby Search error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            const places: any[] = data.places || [];

            // Map to GooglePlaceSuggestion shape for compatibility
            return places.map((place) => ({
                placePrediction: {
                    placeId: place.id,
                    text: {
                        text: place.displayName?.text || '',
                    },
                    structuredFormat: {
                        mainText: {
                            text: place.displayName?.text || '',
                        },
                        secondaryText: place.formattedAddress
                            ? { text: place.formattedAddress }
                            : undefined,
                    },
                },
            }));
        },
        enabled: !!latitude && !!longitude && !!GOOGLE_API_KEY,
        staleTime: 5 * 60 * 1000, // 5 minutes — nearby places don't change often
    });
}

export function usePlacesSearch(options?: UseAddressSearchOptions) {
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
                        radius: 15000, // 15km bias
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
        mutateAsync: selectPlace,
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
                        'id,displayName,formattedAddress,addressComponents,location,websiteUri,nationalPhoneNumber,types',
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
            const state =
                getShortComponent('administrative_area_level_1') ||
                getComponent('administrative_area_level_1');
            const zip = getComponent('postal_code');
            const country =
                getShortComponent('country') || getComponent('country');
            const neighborhood = getComponent('neighborhood');

            const phone = data.nationalPhoneNumber;
            const website = data.websiteUri;
            const types = data.types;

            return {
                name: data.displayName?.text,
                full_address: data.formattedAddress,
                street: street,
                city,
                state,
                zip,
                country,
                neighborhood,
                latitude: data.location?.latitude || 0,
                longitude: data.location?.longitude || 0,
                google_place_id: data.id,
                phone,
                website,
                types,
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
        selectAddress: selectPlace,
        clearSearch,
    };
}

/**
 * Hook for searching addresses specifically (not restaurants/places).
 * Uses Google Places Autocomplete with `address` type filtering.
 * Ideal for the create-venue flow where the user needs to enter
 * a street address rather than search for an existing restaurant.
 */
export function useAddressSearch(
    options?: UseAddressSearchOptions
): UsePlacesSearchReturn {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Address Suggestions Query
    const {
        data: suggestions = [],
        isLoading: isSearching,
        error: searchError,
    } = useQuery({
        queryKey: ['address-autocomplete', debouncedQuery, options?.proximity],
        queryFn: async ({ signal }) => {
            if (!debouncedQuery.trim() || !GOOGLE_API_KEY) return [];

            const requestBody: any = {
                input: debouncedQuery,
                includedPrimaryTypes: [
                    'street_address',
                    'premise',
                    'subpremise',
                    'geocode',
                    'route',
                ],
            };

            if (options?.proximity) {
                requestBody.locationBias = {
                    circle: {
                        center: {
                            latitude: options.proximity.latitude,
                            longitude: options.proximity.longitude,
                        },
                        radius: 10000, // 10km bias for address search
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

    // Details Mutation — reuses the same Place Details logic as usePlacesSearch
    const {
        mutateAsync: selectPlace,
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
                        'id,displayName,formattedAddress,addressComponents,location,websiteUri,nationalPhoneNumber,types',
                },
            });

            if (!response.ok) {
                throw new Error(`Google Places API error: ${response.status}`);
            }

            const data = await response.json();

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
                getComponent('administrative_area_level_2');
            const state =
                getShortComponent('administrative_area_level_1') ||
                getComponent('administrative_area_level_1');
            const zip = getComponent('postal_code');
            const country =
                getShortComponent('country') || getComponent('country');
            const neighborhood = getComponent('neighborhood');

            const phone = data.nationalPhoneNumber;
            const website = data.websiteUri;
            const types = data.types;

            return {
                name: data.displayName?.text,
                full_address: data.formattedAddress,
                street,
                city,
                state,
                zip,
                country,
                neighborhood,
                latitude: data.location?.latitude || 0,
                longitude: data.location?.longitude || 0,
                google_place_id: data.id,
                phone,
                website,
                types,
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
        selectAddress: selectPlace,
        clearSearch,
    };
}
