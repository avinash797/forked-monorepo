import { create } from 'zustand';

type FilterType = 'city' | 'neighborhood';

interface LocationFilterState {
    // Current filter configuration
    filterType: FilterType | null;
    selectedCityId: string | null;
    selectedCityName: string | null;
    selectedNeighborhoodId: string | null;
    selectedNeighborhoodName: string | null;

    // Actions
    setCityFilter: (cityId: string, cityName: string) => void;
    setNeighborhoodFilter: (
        cityId: string,
        cityName: string,
        neighborhoodId: string,
        neighborhoodName: string
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

        // Set city filter
        setCityFilter: (cityId, cityName) =>
            set({
                filterType: 'city',
                selectedCityId: cityId,
                selectedCityName: cityName,
                selectedNeighborhoodId: null,
                selectedNeighborhoodName: null,
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
            }),

        // Reset to default (no filter)
        resetFilter: () =>
            set({
                filterType: null,
                selectedCityId: null,
                selectedCityName: null,
                selectedNeighborhoodId: null,
                selectedNeighborhoodName: null,
            }),

        // Get display name for UI
        getDisplayName: () => {
            const state = get();
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
