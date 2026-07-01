import { supabase } from '@/lib/supabase';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

export interface CitySuggestion {
    placeId: string;
    city: string;
    state: string;
    description: string;
}

export function useCitySearch() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const {
        data: suggestions = [],
        isLoading: isSearching,
        error: searchError,
    } = useQuery({
        queryKey: ['city-search', debouncedQuery],
        queryFn: async ({ signal }): Promise<CitySuggestion[]> => {
            if (!debouncedQuery.trim() || !GOOGLE_API_KEY) return [];

            const response = await fetch(`${BASE_URL}/places:autocomplete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                },
                body: JSON.stringify({
                    input: debouncedQuery,
                    includedPrimaryTypes: ['locality'],
                    includedRegionCodes: ['us'],
                }),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Google Places API error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            const raw = (data.suggestions || []) as any[];

            return raw
                .filter((s: any) => s.placePrediction)
                .map((s: any) => {
                    const { placePrediction } = s;
                    const mainText =
                        placePrediction.structuredFormat?.mainText?.text || '';
                    const secondaryText =
                        placePrediction.structuredFormat?.secondaryText?.text ||
                        '';

                    // secondaryText is typically "State, USA" or similar
                    const state = secondaryText.split(',')[0]?.trim() || '';

                    return {
                        placeId: placePrediction.placeId,
                        city: mainText,
                        state,
                        description: `${mainText}, ${secondaryText}`,
                    };
                });
        },
        enabled: !!debouncedQuery.trim() && !!GOOGLE_API_KEY,
    });

    const {
        mutateAsync: selectCity,
        isPending: isSelecting,
        error: selectError,
    } = useMutation({
        mutationFn: async (
            suggestion: CitySuggestion
        ): Promise<{ cityId: string; displayName: string }> => {
            const { city, state } = suggestion;

            // Check if the city already exists
            const { data: existing } = await supabase
                .from('cities')
                .select('id, name, state')
                .ilike('name', city)
                .ilike('state', state)
                .limit(1)
                .maybeSingle();

            if (existing) {
                return {
                    cityId: existing.id,
                    displayName:
                        `${existing.name}, ${existing.state || ''}`.trim(),
                };
            }

            // Fetch place details to get coordinates
            const details = await fetchPlaceDetails(suggestion.placeId);

            // Create the city with is_active = false
            const slug = slugify(`${city}-${state}`);
            const { data: newCity, error } = await supabase
                .from('cities')
                .insert({
                    name: city,
                    state: state,
                    country: 'USA',
                    slug,
                    is_active: false,
                    coordinates:
                        details.lat && details.lng
                            ? `SRID=4326;POINT(${details.lng} ${details.lat})`
                            : undefined,
                })
                .select('id, name, state')
                .single();

            if (error) {
                // Slug conflict — city was created concurrently, fetch it
                if (error.code === '23505') {
                    const { data: fallback } = await supabase
                        .from('cities')
                        .select('id, name, state')
                        .ilike('name', city)
                        .ilike('state', state)
                        .limit(1)
                        .single();

                    if (fallback) {
                        return {
                            cityId: fallback.id,
                            displayName:
                                `${fallback.name}, ${fallback.state || ''}`.trim(),
                        };
                    }
                }
                throw error;
            }

            return {
                cityId: newCity.id,
                displayName: `${newCity.name}, ${newCity.state || ''}`.trim(),
            };
        },
    });

    return {
        query,
        setQuery,
        suggestions,
        isSearching,
        isSelecting,
        selectCity,
        error:
            (searchError as Error)?.message ||
            (selectError as Error)?.message ||
            null,
    };
}

async function fetchPlaceDetails(
    placeId: string
): Promise<{ lat: number | null; lng: number | null }> {
    if (!GOOGLE_API_KEY) return { lat: null, lng: null };

    try {
        const response = await fetch(`${BASE_URL}/places/${placeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'location',
            },
        });

        if (!response.ok) return { lat: null, lng: null };

        const data = await response.json();
        return {
            lat: data.location?.latitude || null,
            lng: data.location?.longitude || null,
        };
    } catch {
        return { lat: null, lng: null };
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
