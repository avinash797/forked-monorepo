import type { Dish, Venue } from '@/types/rating';
import React, { createContext, useContext, useState } from 'react';

interface RatingFlowState {
  selectedVenue: Venue | null;
  selectedDish: Dish | null;
  rating: number;
  reviewText: string;
  photoUri: string | null;
}

interface RatingFlowContextType {
  state: RatingFlowState;
  setVenue: (venue: Venue) => void;
  setDish: (dish: Dish) => void;
  setRating: (rating: number) => void;
  setReviewText: (text: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: () => void;
  reset: () => void;
}

const RatingFlowContext = createContext<RatingFlowContextType | undefined>(
  undefined
);

const initialState: RatingFlowState = {
  selectedVenue: null,
  selectedDish: null,
  rating: 0,
  reviewText: '',
  photoUri: null,
};

export function RatingFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RatingFlowState>(initialState);

  const setVenue = (venue: Venue) => {
    setState((prev) => ({ ...prev, selectedVenue: venue }));
  };

  const setDish = (dish: Dish) => {
    setState((prev) => ({ ...prev, selectedDish: dish }));
  };

  const setRating = (rating: number) => {
    setState((prev) => ({ ...prev, rating: rating }));
  };

  const setReviewText = (text: string) => {
    setState((prev) => ({ ...prev, reviewText: text }));
  };

  const addPhoto = (uri: string) => {
    setState((prev) => ({
      ...prev,
      photoUri: uri,
    }));
  };

  const removePhoto = () => {
    setState((prev) => ({
      ...prev,
      photoUri: null,
    }));
  };

  const reset = () => {
    setState(initialState);
  };

  const value: RatingFlowContextType = {
    state,
    setVenue,
    setDish,
    setRating,
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
