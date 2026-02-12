import { Database } from '@/types/database.types';
import { DishType } from '@/types/dishes';
import { create } from 'zustand';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export interface NewCityInfo {
    cityId: string;
    cityName: string;
    state: string;
    country: string;
}

interface RatingState {
    // Photo state
    photoUri: string | null;
    setPhotoUri: (uri: string | null) => void;

    // Restaurant state
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant | null) => void;

    // Dish Type state
    selectedDishType: DishType | null;
    setSelectedDishType: (dishType: DishType | null) => void;

    // Variation state (from dish_type_variations)
    selectedVariationId: string | null;
    setSelectedVariationId: (variationId: string | null) => void;

    // Rating and review state
    rating: number;
    setRating: (rating: number) => void;
    reviewText: string;
    setReviewText: (text: string) => void;

    // Taste tags
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;

    // Location state
    location: any | null;
    setLocation: (location: any | null) => void;

    // New city info (set when user triggers city creation, used by onboarding screen)
    newCityInfo: NewCityInfo | null;
    setNewCityInfo: (info: NewCityInfo | null) => void;

    // Reset all state (call after successful submission)
    resetRating: () => void;
}

export const useRatingStore = create<RatingState>((set) => ({
    // Initial state
    photoUri: null,
    selectedRestaurant: null,
    selectedDishType: null,
    selectedVariationId: null,
    rating: 0,
    reviewText: '',
    selectedTags: [],
    location: null,
    newCityInfo: null,

    // Actions
    setPhotoUri: (uri) => set({ photoUri: uri }),
    setSelectedRestaurant: (restaurant) =>
        set({ selectedRestaurant: restaurant }),
    setSelectedDishType: (dishType) => set({ selectedDishType: dishType }),
    setSelectedVariationId: (variationId) =>
        set({ selectedVariationId: variationId }),
    setRating: (rating) => set({ rating }),
    setReviewText: (text) => set({ reviewText: text }),
    setSelectedTags: (tags) => set({ selectedTags: tags }),
    setLocation: (location) => set({ location }),
    setNewCityInfo: (info) => set({ newCityInfo: info }),

    // Reset function
    resetRating: () =>
        set({
            photoUri: null,
            selectedRestaurant: null,
            selectedDishType: null,
            selectedVariationId: null,
            rating: 0,
            reviewText: '',
            selectedTags: [],
            location: null,
            newCityInfo: null,
        }),
}));
