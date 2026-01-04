import type { Dish, LocationCoordinates, Venue } from '@/types/rating';
import { create } from 'zustand';

interface RatingState {
  // Photo state
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;

  // Venue state
  selectedVenue: Venue | null;
  setSelectedVenue: (venue: Venue | null) => void;

  // Dish state
  selectedDish: Dish | null;
  setSelectedDish: (dish: Dish | null) => void;

  // Rating and review state
  rating: number;
  setRating: (rating: number) => void;
  reviewText: string;
  setReviewText: (text: string) => void;

  // Location state
  location: LocationCoordinates | null;
  setLocation: (location: LocationCoordinates | null) => void;

  // Reset all state (call after successful submission)
  resetRating: () => void;
}

export const useRatingStore = create<RatingState>((set) => ({
  // Initial state
  photoUri: null,
  selectedVenue: null,
  selectedDish: null,
  rating: 0,
  reviewText: '',
  location: null,

  // Actions
  setPhotoUri: (uri) => set({ photoUri: uri }),
  setSelectedVenue: (venue) => set({ selectedVenue: venue }),
  setSelectedDish: (dish) => set({ selectedDish: dish }),
  setRating: (rating) => set({ rating }),
  setReviewText: (text) => set({ reviewText: text }),
  setLocation: (location) => set({ location }),

  // Reset function
  resetRating: () =>
    set({
      photoUri: null,
      selectedVenue: null,
      selectedDish: null,
      rating: 0,
      reviewText: '',
      location: null,
    }),
}));
