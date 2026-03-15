/**
 * Type-safe interfaces for all Supabase RPCs that return untyped JSON.
 * Derived from SQL definitions in 20260302235108_functions_and_rpcs.sql.
 */

// ── get_leaderboard ─────────────────────────────────────────────────

export interface LeaderboardEntry {
    rank: number;
    restaurant_id: string;
    restaurant_name: string;
    address: string;
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
