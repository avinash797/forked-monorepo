-- Migration: Add types column to restaurants
-- Array of string labels for restaurant types (e.g., Italian, Fast Casual, Food Truck)

ALTER TABLE public.restaurants
  ADD COLUMN types text[] DEFAULT '{}';

COMMENT ON COLUMN public.restaurants.types
  IS 'Array of restaurant type labels (e.g., Italian, Fast Casual, Food Truck)';
