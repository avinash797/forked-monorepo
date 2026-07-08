/**
 * Type-safe interfaces for all Supabase RPCs that return untyped JSON.
 * Derived from SQL definitions in 20260302235108_functions_and_rpcs.sql.
 */

import type { NewBadgeAward } from './badge.types';

// ── Shared ──────────────────────────────────────────────────────────

/** Battle opponent nested in create_rating / submit_comparison responses */
export interface BattleOpponent {
    rating_id: string;
    restaurant_id: string;
    restaurant_name: string;
    elo_score: number;
    derived_score: number;
    photo_url: string | null;
}

// ── create_rating ───────────────────────────────────────────────────

export interface CreateRatingResponse {
    rating_id: string;
    battle_id: string | null;
    opponent: BattleOpponent | null;
    opponent_index: number | null;
    battle_complete: boolean;
    is_re_rating: boolean;
    total_candidates?: number;
    elo_score: number;
    derived_score?: number;
    /** Present when battle_complete = true */
    new_badges?: NewBadgeAward[];
}

// ── submit_comparison ───────────────────────────────────────────────

export interface SubmitComparisonResponse {
    battle_complete: boolean;
    rating_id: string;
    /** Present when battle_complete = true */
    final_elo?: number;
    /** Present when battle_complete = true */
    final_derived_score?: number;
    /** Present when battle_complete = true */
    comparisons_made?: number;
    /** Present when battle_complete = false */
    current_elo?: number;
    /** Present when battle_complete = false */
    opponent?: BattleOpponent;
    /** Present when battle_complete = false */
    opponent_index?: number;
    /** Present when battle_complete = false */
    step?: number;
    /** Present when battle_complete = false */
    remaining_range?: number;
    /** Present when battle_complete = true */
    new_badges?: NewBadgeAward[];
}

// ── get_leaderboard ─────────────────────────────────────────────────

export interface LeaderboardEntry {
    rank: number;
    restaurant_id: string;
    restaurant_name: string;
    address: string;
    neighborhood_name: string | null;
    bayesian_score: number;
    total_ratings: number;
    confidence_tier: string;
    featured_photo_url: string | null;
}

// ── get_personal_rankings ───────────────────────────────────────────

export interface PersonalRankingEntry {
    rank: number;
    rating_id: string;
    restaurant_id: string;
    restaurant_name: string;
    elo_score: number;
    derived_score: number;
    sentiment: 'liked' | 'okay' | 'disliked';
    photo_url: string | null;
    comparison_count: number;
    notes: string | null;
    rated_at: string;
    variation_name: string | null;
    neighborhood_name: string | null;
    city_name: string | null;
}

// ── get_user_stats ──────────────────────────────────────────────────

export interface UserStatsResponse {
    user_id: string;
    username: string | null;
    total_ratings: number;
    total_comparisons: number;
    credibility_score: number;
    dishes_by_type: Record<string, number> | null;
    cities_rated_in: number;
    member_since: string;
    skip_rate: number | null;
}

// ── get_personal_dish_type_counts ───────────────────────────────────

export type PersonalDishTypeCounts = Record<string, number>;

// ── match_location ──────────────────────────────────────────────────

export interface MatchLocationCity {
    id: string;
    name: string;
    state: string;
    slug: string;
    /**
     * Distance from the user to the matched city's center. Cities are only
     * matched when active (unlocked), so US-wide this can be very large —
     * clients should fall back to Nearby mode beyond a sensible threshold.
     */
    distance_meters: number;
}

export interface MatchLocationNeighborhood {
    id: string;
    name: string;
    slug: string;
}

export interface MatchLocationResponse {
    city: MatchLocationCity | null;
    neighborhood: MatchLocationNeighborhood | null;
}

// ── anonymize_user_data ─────────────────────────────────────────────

export interface AnonymizeUserDataResponse {
    success: boolean;
    user_id: string;
    ratings_anonymized: number;
    comparisons_preserved: number;
    note: string;
}

// ── close_restaurant ────────────────────────────────────────────────

export interface CloseRestaurantResponse {
    success: boolean;
    restaurant_id: string;
    restaurant_name: string;
    closed_at: string;
}

// ── get_dish_type_entry_counts ───────────────────────────────────────

export interface DishTypeEntryCount {
    dish_type_id: string;
    entry_count: number;
}

// ── delete_user_account ─────────────────────────────────────────────

export interface DeleteUserAccountResponse {
    success: boolean;
    user_id: string;
    ratings_deleted: number;
    note: string;
}

// ── get_admin_daily_stats ────────────────────────────────────────────

export interface DailyStat {
    day: string;
    new_users: number;
    new_ratings: number;
    new_battles: number;
}

// ── get_admin_city_breakdown ─────────────────────────────────────────

export interface CityBreakdown {
    city_id: string;
    city_name: string;
    total_ratings: number;
    total_battles: number;
    total_restaurants: number;
}

// ── get_admin_dish_type_breakdown ────────────────────────────────────

export interface DishTypeBreakdown {
    dish_type_id: string;
    dish_type_name: string;
    total_ratings: number;
    total_battles: number;
    avg_score: number | null;
}
