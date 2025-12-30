// Discovery & Browsing Feature Types

import type { Dish, Venue, Review } from './rating';

// ============================================================================
// Display Types for Browse Feature
// ============================================================================

/**
 * Dish with venue information populated
 * Used in: Home feed, search results, venue detail
 */
export interface DishWithVenue extends Dish {
  venue?: Venue;
}

/**
 * Review with user profile information populated
 * Used in: Dish detail screen, review lists
 */
export interface ReviewWithUserProfile extends Review {
  profile?: {
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  };
}

/**
 * Venue with all dishes populated
 * Used in: Venue detail screen
 */
export interface VenueWithDishes extends Venue {
  dishes?: Dish[];
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Discriminated union for search results
 * Allows rendering different card types in a unified list
 */
export type SearchResult =
  | { type: 'dish'; data: DishWithVenue }
  | { type: 'venue'; data: Venue };

// ============================================================================
// Filter & Pagination Types
// ============================================================================

/**
 * Filters for top dishes query
 * Used in: Home feed, filtered browse views
 */
export interface TopDishesFilters {
  city?: string;
  minRating?: number;
  dish_type_id?: string; // Use dish_types table for structured filtering
  limit?: number;
  offset?: number;
}

/**
 * Pagination state for "Load More" button
 */
export interface PaginationState {
  offset: number;
  limit: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}
