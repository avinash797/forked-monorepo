import { create } from 'zustand';

type FilterType = 'nearby' | 'location';

interface LocationFilterState {
    // Current filter configuration
    filterType: FilterType;
    radius: number; // in km
    selectedLocation: string | null; // city or neighborhood name

    // UI helpers
    getDisplayText: () => string;

    // Actions
    setNearbyFilter: (radius: number) => void;
    setLocationFilter: (location: string) => void;
    resetFilter: () => void;
}

const DEFAULT_RADIUS = 5; // 5km default

export const useLocationFilterStore = create<LocationFilterState>(
    (set, get) => ({
        // Initial state
        filterType: 'nearby',
        radius: DEFAULT_RADIUS,
        selectedLocation: null,

        // Get display text for the header
        getDisplayText: () => {
            const state = get();
            if (state.filterType === 'nearby') {
                return `Nearby (${state.radius}km)`;
            }
            return state.selectedLocation || 'All Locations';
        },

        // Set nearby filter with radius
        setNearbyFilter: (radius) =>
            set({
                filterType: 'nearby',
                radius,
                selectedLocation: null,
            }),

        // Set location filter (city/neighborhood)
        setLocationFilter: (location) =>
            set({
                filterType: 'location',
                selectedLocation: location,
            }),

        // Reset to default
        resetFilter: () =>
            set({
                filterType: 'nearby',
                radius: DEFAULT_RADIUS,
                selectedLocation: null,
            }),
    })
);
