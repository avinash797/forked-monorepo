import { create } from 'zustand';

type FilterType = 'nearby' | 'location';

interface LocationFilterState {
    // Current filter configuration
    filterType: FilterType;
    radius: number; // in km
    selectedLocation: string | null; // city or neighborhood name

    // Actions
    setNearbyFilter: (radius: number) => void;
    setLocationFilter: (location: string) => void;
    resetFilter: () => void;
}

const DEFAULT_RADIUS = 5; // 5km default

export const useLocationFilterStore = create<LocationFilterState>((set) => ({
    // Initial state
    filterType: 'nearby',
    radius: DEFAULT_RADIUS,
    selectedLocation: null,

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
}));
