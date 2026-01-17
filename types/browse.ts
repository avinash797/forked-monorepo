// Discovery & Browsing Feature Types

import type { Dish, Review, Venue } from './rating';

// ============================================================================
// Trending Types
// ============================================================================

/**
 * Trend direction indicator
 * - 'rising': Rating is increasing (good momentum)
 * - 'falling': Rating is decreasing
 * - 'stable': No significant change
 * - 'new': Dish is less than 7 days old or no historical data
 */
export type TrendDirection = 'rising' | 'falling' | 'stable' | 'new';

/**
 * Dish with trending information
 * Used in: Trending section, Explore tab
 */
export interface TrendingDish extends DishWithVenue {
    trend_direction: TrendDirection;
    trend_score: number;
    rating_change_7d: number | null;
    rating_change_30d: number | null;
    review_velocity_7d: number;
}

/**
 * Rating history data point for charts
 * Each point represents a daily snapshot of the dish's rating
 */
export interface RatingHistoryPoint {
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    /** Average rating at this point in time (0-10) */
    rating: number;
    /** Total review count at this point */
    reviewCount: number;
    /** Rating change compared to 7 days prior */
    ratingChange7d: number | null;
    /** Number of reviews added in the 7 days prior */
    reviewVelocity7d: number;
}

/**
 * Filters for trending dishes query
 */
export interface TrendingDishesFilters {
    /** Filter by city name */
    city?: string;
    /** Filter by trend direction (default: 'rising') */
    direction?: TrendDirection | 'all';
    /** Number of dishes to fetch per page (default: 20) */
    limit?: number;
}

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
        avatar_url: string | null;
    } | null;
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

// ============================================================================
// Leaderboard Types
// ============================================================================

/**
 * Dish type that qualifies for leaderboard display
 * Must have at least 3 dishes with ratings
 */
export interface DishTypeForLeaderboard {
    id: string;
    name: string;
    category: string;
    /** Number of rated dishes for this type */
    rated_dish_count: number;
}

/**
 * Single leaderboard entry with rank and medal
 * Used in: Leaderboard screen
 */
export interface LeaderboardItem {
    /** Rank position (1-indexed) */
    rank: number;
    /** The dish information */
    dish: Dish;
    /** The venue where this dish is served */
    venue: Venue;
    /** Medal type for top 3 */
    medal?: 'gold' | 'silver' | 'bronze';
}
