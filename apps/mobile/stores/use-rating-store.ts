import { Database } from '@forked/supabase';
import { DishType } from '@forked/types/dishes';
import { create } from 'zustand';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export type Sentiment = 'liked' | 'okay' | 'disliked';

export interface BattleOpponent {
    rating_id: string;
    restaurant_id: string;
    restaurant_name: string;
    photo_url: string | null;
    derived_score: number | null;
    elo_score: number | null;
}

export interface BattleState {
    battleId: string;
    ratingId: string;
    maxSteps: number;
    currentStep: number;
    opponent: BattleOpponent;
}

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

    // Sentiment (replaces numeric rating)
    sentiment: Sentiment | null;
    setSentiment: (sentiment: Sentiment | null) => void;

    // Review text
    reviewText: string;
    setReviewText: (text: string) => void;

    // Taste tags
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;

    // Location state
    location: any | null;
    setLocation: (location: any | null) => void;

    // Battle state (active binary insertion sort sequence)
    battleState: BattleState | null;
    setBattleState: (state: BattleState | null) => void;
    clearBattleState: () => void;

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
    sentiment: null,
    reviewText: '',
    selectedTags: [],
    location: null,
    battleState: null,
    newCityInfo: null,

    // Actions
    setPhotoUri: (uri) => set({ photoUri: uri }),
    setSelectedRestaurant: (restaurant) =>
        set({ selectedRestaurant: restaurant }),
    setSelectedDishType: (dishType) => set({ selectedDishType: dishType }),
    setSelectedVariationId: (variationId) =>
        set({ selectedVariationId: variationId }),
    setSentiment: (sentiment) => set({ sentiment }),
    setReviewText: (text) => set({ reviewText: text }),
    setSelectedTags: (tags) => set({ selectedTags: tags }),
    setLocation: (location) => set({ location }),
    setBattleState: (battleState) => set({ battleState }),
    clearBattleState: () => set({ battleState: null }),
    setNewCityInfo: (info) => set({ newCityInfo: info }),

    // Reset function
    resetRating: () =>
        set({
            photoUri: null,
            selectedRestaurant: null,
            selectedDishType: null,
            selectedVariationId: null,
            sentiment: null,
            reviewText: '',
            selectedTags: [],
            location: null,
            battleState: null,
            newCityInfo: null,
        }),
}));
