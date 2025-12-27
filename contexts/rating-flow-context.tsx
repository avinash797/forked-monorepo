import React, { createContext, useContext, useState } from 'react';
import type { Venue, Dish } from '@/types/rating';

interface RatingFlowState {
  selectedVenue: Venue | null;
  selectedDish: Dish | null;
  starRating: number;
  reviewText: string;
  photoUris: string[];
}

interface RatingFlowContextType {
  state: RatingFlowState;
  setVenue: (venue: Venue) => void;
  setDish: (dish: Dish) => void;
  setStarRating: (rating: number) => void;
  setReviewText: (text: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (uri: string) => void;
  reset: () => void;
}

const RatingFlowContext = createContext<RatingFlowContextType | undefined>(
  undefined
);

const initialState: RatingFlowState = {
  selectedVenue: null,
  selectedDish: null,
  starRating: 0,
  reviewText: '',
  photoUris: [],
};

export function RatingFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RatingFlowState>(initialState);

  const setVenue = (venue: Venue) => {
    setState((prev) => ({ ...prev, selectedVenue: venue }));
  };

  const setDish = (dish: Dish) => {
    setState((prev) => ({ ...prev, selectedDish: dish }));
  };

  const setStarRating = (rating: number) => {
    setState((prev) => ({ ...prev, starRating: rating }));
  };

  const setReviewText = (text: string) => {
    setState((prev) => ({ ...prev, reviewText: text }));
  };

  const addPhoto = (uri: string) => {
    setState((prev) => ({
      ...prev,
      photoUris: [...prev.photoUris, uri],
    }));
  };

  const removePhoto = (uri: string) => {
    setState((prev) => ({
      ...prev,
      photoUris: prev.photoUris.filter((u) => u !== uri),
    }));
  };

  const reset = () => {
    setState(initialState);
  };

  const value: RatingFlowContextType = {
    state,
    setVenue,
    setDish,
    setStarRating,
    setReviewText,
    addPhoto,
    removePhoto,
    reset,
  };

  return (
    <RatingFlowContext.Provider value={value}>
      {children}
    </RatingFlowContext.Provider>
  );
}

export function useRatingFlow() {
  const context = useContext(RatingFlowContext);
  if (context === undefined) {
    throw new Error('useRatingFlow must be used within RatingFlowProvider');
  }
  return context;
}
