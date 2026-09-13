import { supabase } from '@/lib/supabase';
import type { MatchLocationResponse } from '@forked/supabase';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { useLocationFilterStore } from './use-location-filter-store';

interface LocationState {
    currentLocation: Location.LocationObject | null;
    currentCity: City | null;
    currentNeighborhood: Neighborhood | null;
    permissionStatus: Location.PermissionStatus | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    requestPermission: () => Promise<boolean>;
    getCurrentMatchedLocation: () => Promise<void>;
    setCurrentCity: (city: City) => void;
    setCurrentNeighborhood: (neighborhood: Neighborhood | null) => void;
}

export interface City {
    id: string;
    name: string;
    state: string;
    slug: string;
}

export interface Neighborhood {
    id: string;
    name: string;
    slug: string;
}

/**
 * Beyond this distance the nearest unlocked city isn't "your city" — the
 * filter defaults to Nearby mode instead of auto-selecting a far-away city.
 */
const MAX_CITY_MATCH_METERS = 100_000; // ~62 miles

const DEFAULT_NEARBY_RADIUS_METERS = 3218; // ~2 miles, matches leaderboard default

export const useLocationStore = create<LocationState>((set, get) => ({
    currentLocation: null,
    currentCity: null,
    currentNeighborhood: null,
    permissionStatus: null,
    isLoading: false,
    error: null,

    requestPermission: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        set({ permissionStatus: status });
        return status === 'granted';
    },

    getCurrentMatchedLocation: async () => {
        set({ isLoading: true, error: null });

        try {
            const hasPermission = await get().requestPermission();
            if (!hasPermission) {
                set({ error: 'Location permission denied', isLoading: false });
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            set({ currentLocation: location });

            const { data: rpcData, error } = await supabase.rpc(
                'match_location',
                {
                    lat: location.coords.latitude,
                    long: location.coords.longitude,
                }
            );

            if (error) throw error;

            const data = rpcData as unknown as MatchLocationResponse;

            if (data) {
                // match_location only considers unlocked cities and falls back
                // to the NEAREST one, which US-wide can be hundreds of miles
                // away. Only treat the match as "current city" when the user
                // is plausibly in it; otherwise default the filter to Nearby.
                const isFarAway =
                    (data.city?.distance_meters ?? 0) > MAX_CITY_MATCH_METERS;

                set({
                    currentCity: isFarAway ? null : data.city,
                    currentNeighborhood: isFarAway ? null : data.neighborhood,
                    isLoading: false,
                });
                const { filterType, selectedCityId, setCityFilter, setNearbyFilter } =
                    useLocationFilterStore.getState();
                if (!filterType && !selectedCityId) {
                    if (data.city && !isFarAway) {
                        setCityFilter(data.city.id, data.city.name);
                    } else {
                        setNearbyFilter(
                            location.coords.latitude,
                            location.coords.longitude,
                            DEFAULT_NEARBY_RADIUS_METERS
                        );
                    }
                }
            } else {
                set({ isLoading: false });
            }
        } catch (error: any) {
            // console.error('Error fetching location context:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrentCity: (city) => set({ currentCity: city }),
    setCurrentNeighborhood: (neighborhood) =>
        set({ currentNeighborhood: neighborhood }),
}));
