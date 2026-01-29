import { create } from 'zustand';

type FilterType = 'city' | 'neighborhood' | 'nearby';

interface NearbyConfig {
    latitude: number;
    longitude: number;
    radiusMeters: number;
}

interface LocationFilterState {
    // Current filter configuration
    filterType: FilterType | null;
    selectedCityId: string | null;
    selectedCityName: string | null;
    selectedNeighborhoodId: string | null;
    selectedNeighborhoodName: string | null;
    nearbyConfig: NearbyConfig | null;

    // Actions
    setCityFilter: (cityId: string, cityName: string) => void;
    setNeighborhoodFilter: (
        cityId: string,
        cityName: string,
        neighborhoodId: string,
        neighborhoodName: string
    ) => void;
    setNearbyFilter: (
        latitude: number,
        longitude: number,
        radiusMeters: number
    ) => void;
    resetFilter: () => void;

    // Helper getters
    getDisplayName: () => string;
}

export const useLocationFilterStore = create<LocationFilterState>(
    (set, get) => ({
        // Initial state - no filter selected
        filterType: null,
        selectedCityId: null,
        selectedCityName: null,
        selectedNeighborhoodId: null,
        selectedNeighborhoodName: null,
        nearbyConfig: null,

        // Set city filter
        setCityFilter: (cityId, cityName) =>
            set({
                filterType: 'city',
                selectedCityId: cityId,
                selectedCityName: cityName,
                selectedNeighborhoodId: null,
                selectedNeighborhoodName: null,
                nearbyConfig: null,
            }),

        // Set neighborhood filter (includes parent city)
        setNeighborhoodFilter: (
            cityId,
            cityName,
            neighborhoodId,
            neighborhoodName
        ) =>
            set({
                filterType: 'neighborhood',
                selectedCityId: cityId,
                selectedCityName: cityName,
                selectedNeighborhoodId: neighborhoodId,
                selectedNeighborhoodName: neighborhoodName,
                nearbyConfig: null,
            }),

        // Set nearby filter (lat/long/radius)
        setNearbyFilter: (latitude, longitude, radiusMeters) =>
            set({
                filterType: 'nearby',
                selectedCityId: null,
                selectedCityName: null,
                selectedNeighborhoodId: null,
                selectedNeighborhoodName: null,
                nearbyConfig: { latitude, longitude, radiusMeters },
            }),

        // Reset to default (no filter)
        resetFilter: () =>
            set({
                filterType: null,
                selectedCityId: null,
                selectedCityName: null,
                selectedNeighborhoodId: null,
                selectedNeighborhoodName: null,
                nearbyConfig: null,
            }),

        // Get display name for UI
        getDisplayName: () => {
            const state = get();
            if (state.filterType === 'nearby' && state.nearbyConfig) {
                const km = (state.nearbyConfig.radiusMeters / 1000).toFixed(1);
                return `Nearby (${km} km)`;
            }
            if (state.filterType === 'neighborhood' && state.selectedNeighborhoodName) {
                return state.selectedNeighborhoodName;
            }
            if (state.filterType === 'city' && state.selectedCityName) {
                return state.selectedCityName;
            }
            return 'All Locations';
        },
    })
);
