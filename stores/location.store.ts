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
    getCurrentLocation: () => Promise<void>;
    setCurrentCity: (city: City) => void;
}

interface City {
    id: string;
    name: string;
    state: string;
}

interface Neighborhood {
    id: string;
    name: string;
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

    getCurrentLocation: async () => {
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

            set({ currentLocation: location, isLoading: false });

            // Reverse geocode to get city/neighborhood
            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (address) {
                // Match to our city database
                // This would be an API call in reality
                set({
                    currentCity: {
                        id: 'nola-id',
                        name: address.city || 'Unknown',
                        state: address.region || '',
                    },
                });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrentCity: (city) => set({ currentCity: city }),
}));
