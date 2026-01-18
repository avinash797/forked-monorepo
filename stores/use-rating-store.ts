import { Database } from '@/types/database.types';
import { DishType } from '@/types/dishType';
import type { Dish, LocationCoordinates, Venue } from '@/types/rating';
import { create } from 'zustand';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface RatingState {
    // Photo state
    photoUri: string | null;
    setPhotoUri: (uri: string | null) => void;

    // Restaurant state (v0.1 - replaces venue)
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant | null) => void;

    // Dish Type state (v0.1 - replaces custom dish)
    selectedDishType: DishType | null;
    setSelectedDishType: (dishType: DishType | null) => void;

    // Legacy: Venue state (for backwards compatibility)
    selectedVenue: Venue | null;
    setSelectedVenue: (venue: Venue | null) => void;

    // Legacy: Dish state (for backwards compatibility)
    selectedDish: Dish | null;
    setSelectedDish: (dish: Dish | null) => void;

    // Rating and review state
    rating: number;
    setRating: (rating: number) => void;
    reviewText: string;
    setReviewText: (text: string) => void;

    // Taste tags (v0.1)
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;

    // Location state
    location: LocationCoordinates | null;
    setLocation: (location: LocationCoordinates | null) => void;

    // Reset all state (call after successful submission)
    resetRating: () => void;
}

export const useRatingStore = create<RatingState>((set) => ({
    // Initial state
    photoUri: null,
    selectedRestaurant: null,
    selectedDishType: null,
    selectedVenue: null,
    selectedDish: null,
    rating: 0,
    reviewText: '',
    selectedTags: [],
    location: null,

    // Actions
    setPhotoUri: (uri) => set({ photoUri: uri }),
    setSelectedRestaurant: (restaurant) =>
        set({ selectedRestaurant: restaurant }),
    setSelectedDishType: (dishType) => set({ selectedDishType: dishType }),
    setSelectedVenue: (venue) => set({ selectedVenue: venue }),
    setSelectedDish: (dish) => set({ selectedDish: dish }),
    setRating: (rating) => set({ rating }),
    setReviewText: (text) => set({ reviewText: text }),
    setSelectedTags: (tags) => set({ selectedTags: tags }),
    setLocation: (location) => set({ location }),

    // Reset function
    resetRating: () =>
        set({
            photoUri: null,
            selectedRestaurant: null,
            selectedDishType: null,
            selectedVenue: null,
            selectedDish: null,
            rating: 0,
            reviewText: '',
            selectedTags: [],
            location: null,
        }),
}));
