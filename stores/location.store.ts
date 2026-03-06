import { supabase } from '@/lib/supabase';
import type { MatchLocationResponse } from '@/types/rpc.types';
import * as Location from 'expo-location';
import { create } from 'zustand';

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
                set({
                    currentCity: data.city,
                    currentNeighborhood: data.neighborhood,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error: any) {
            // console.error('Error fetching location context:', error);
            // Fallback for development/testing if RPC fails or no city found
            // For MVP launch we might want to default to NOLA if testing elsewhere
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrentCity: (city) => set({ currentCity: city }),
    setCurrentNeighborhood: (neighborhood) =>
        set({ currentNeighborhood: neighborhood }),
}));
