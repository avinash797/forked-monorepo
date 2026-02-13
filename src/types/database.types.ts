export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      cities: {
        Row: {
          coordinates: unknown;
          country: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          slug: string;
          state: string | null;
          updated_at: string | null;
        };
        Insert: {
          coordinates?: unknown;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          slug: string;
          state?: string | null;
          updated_at?: string | null;
        };
        Update: {
          coordinates?: unknown;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
          state?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      city_known_dishes: {
        Row: {
          city_id: string;
          created_at: string | null;
          dish_type_id: string;
          display_order: number | null;
        };
        Insert: {
          city_id: string;
          created_at?: string | null;
          dish_type_id: string;
          display_order?: number | null;
        };
        Update: {
          city_id?: string;
          created_at?: string | null;
          dish_type_id?: string;
          display_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "city_known_dishes_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "city_known_dishes_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
        ];
      };
      comparisons: {
        Row: {
          created_at: string | null;
          dish_type_id: string;
          id: string;
          rating_a_elo_after: number | null;
          rating_a_elo_before: number | null;
          rating_a_id: string;
          rating_b_elo_after: number | null;
          rating_b_elo_before: number | null;
          rating_b_id: string;
          skip_reason: string | null;
          skipped: boolean | null;
          user_id: string;
          winner_rating_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          dish_type_id: string;
          id?: string;
          rating_a_elo_after?: number | null;
          rating_a_elo_before?: number | null;
          rating_a_id: string;
          rating_b_elo_after?: number | null;
          rating_b_elo_before?: number | null;
          rating_b_id: string;
          skip_reason?: string | null;
          skipped?: boolean | null;
          user_id: string;
          winner_rating_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          dish_type_id?: string;
          id?: string;
          rating_a_elo_after?: number | null;
          rating_a_elo_before?: number | null;
          rating_a_id?: string;
          rating_b_elo_after?: number | null;
          rating_b_elo_before?: number | null;
          rating_b_id?: string;
          skip_reason?: string | null;
          skipped?: boolean | null;
          user_id?: string;
          winner_rating_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comparisons_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparisons_rating_a_id_fkey";
            columns: ["rating_a_id"];
            isOneToOne: false;
            referencedRelation: "personal_ratings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparisons_rating_b_id_fkey";
            columns: ["rating_b_id"];
            isOneToOne: false;
            referencedRelation: "personal_ratings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparisons_user_profile_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparisons_winner_rating_id_fkey";
            columns: ["winner_rating_id"];
            isOneToOne: false;
            referencedRelation: "personal_ratings";
            referencedColumns: ["id"];
          },
        ];
      };
      dish_type_variations: {
        Row: {
          created_at: string | null;
          dish_type_id: string;
          emoji: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          dish_type_id: string;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          dish_type_id?: string;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dish_type_variations_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
        ];
      };
      dish_types: {
        Row: {
          aliases: string[] | null;
          created_at: string | null;
          emoji: string | null;
          id: string;
          is_active: boolean | null;
          launch_order: number | null;
          name: string;
          slug: string;
        };
        Insert: {
          aliases?: string[] | null;
          created_at?: string | null;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          launch_order?: number | null;
          name: string;
          slug: string;
        };
        Update: {
          aliases?: string[] | null;
          created_at?: string | null;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          launch_order?: number | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      global_dish_scores: {
        Row: {
          avg_raw_score: number | null;
          battles_won: number | null;
          city_id: string;
          confidence_score: number | null;
          created_at: string | null;
          dish_type_id: string;
          featured_photo_url: string | null;
          featured_rating_id: string | null;
          global_elo: number | null;
          id: string;
          neighborhood_id: string | null;
          restaurant_id: string;
          total_battles: number | null;
          total_ratings: number | null;
          updated_at: string | null;
          win_rate: number | null;
        };
        Insert: {
          avg_raw_score?: number | null;
          battles_won?: number | null;
          city_id: string;
          confidence_score?: number | null;
          created_at?: string | null;
          dish_type_id: string;
          featured_photo_url?: string | null;
          featured_rating_id?: string | null;
          global_elo?: number | null;
          id?: string;
          neighborhood_id?: string | null;
          restaurant_id: string;
          total_battles?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          win_rate?: number | null;
        };
        Update: {
          avg_raw_score?: number | null;
          battles_won?: number | null;
          city_id?: string;
          confidence_score?: number | null;
          created_at?: string | null;
          dish_type_id?: string;
          featured_photo_url?: string | null;
          featured_rating_id?: string | null;
          global_elo?: number | null;
          id?: string;
          neighborhood_id?: string | null;
          restaurant_id?: string;
          total_battles?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          win_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "global_dish_scores_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_dish_scores_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_dish_scores_featured_rating_id_fkey";
            columns: ["featured_rating_id"];
            isOneToOne: false;
            referencedRelation: "personal_ratings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_dish_scores_neighborhood_id_fkey";
            columns: ["neighborhood_id"];
            isOneToOne: false;
            referencedRelation: "neighborhoods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_dish_scores_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      leaderboard_snapshots: {
        Row: {
          avg_raw_score: number | null;
          battles_won: number | null;
          city_id: string;
          confidence_score: number | null;
          created_at: string | null;
          dish_type_id: string;
          global_dish_score_id: string;
          global_elo: number;
          id: string;
          neighborhood_id: string | null;
          rank_position: number;
          restaurant_id: string;
          snapshot_date: string;
          total_battles: number | null;
          total_ratings: number | null;
          win_rate: number | null;
        };
        Insert: {
          avg_raw_score?: number | null;
          battles_won?: number | null;
          city_id: string;
          confidence_score?: number | null;
          created_at?: string | null;
          dish_type_id: string;
          global_dish_score_id: string;
          global_elo: number;
          id?: string;
          neighborhood_id?: string | null;
          rank_position: number;
          restaurant_id: string;
          snapshot_date: string;
          total_battles?: number | null;
          total_ratings?: number | null;
          win_rate?: number | null;
        };
        Update: {
          avg_raw_score?: number | null;
          battles_won?: number | null;
          city_id?: string;
          confidence_score?: number | null;
          created_at?: string | null;
          dish_type_id?: string;
          global_dish_score_id?: string;
          global_elo?: number;
          id?: string;
          neighborhood_id?: string | null;
          rank_position?: number;
          restaurant_id?: string;
          snapshot_date?: string;
          total_battles?: number | null;
          total_ratings?: number | null;
          win_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_snapshots_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_snapshots_global_dish_score_id_fkey";
            columns: ["global_dish_score_id"];
            isOneToOne: false;
            referencedRelation: "global_dish_scores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_snapshots_neighborhood_id_fkey";
            columns: ["neighborhood_id"];
            isOneToOne: false;
            referencedRelation: "neighborhoods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_snapshots_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      neighborhoods: {
        Row: {
          boundary: unknown;
          city_id: string;
          created_at: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          boundary?: unknown;
          city_id: string;
          created_at?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          boundary?: unknown;
          city_id?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_rating_tags: {
        Row: {
          created_at: string | null;
          rating_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string | null;
          rating_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string | null;
          rating_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personal_rating_tags_rating_id_fkey";
            columns: ["rating_id"];
            isOneToOne: false;
            referencedRelation: "personal_ratings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_rating_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "taste_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_ratings: {
        Row: {
          battles_lost: number | null;
          battles_total: number | null;
          battles_won: number | null;
          created_at: string | null;
          dish_type_id: string;
          exif_location: unknown;
          exif_timestamp: string | null;
          id: string;
          location_verified: boolean | null;
          notes: string | null;
          personal_elo: number | null;
          photo_storage_path: string | null;
          photo_url: string;
          raw_score: number;
          restaurant_id: string;
          updated_at: string | null;
          user_id: string;
          variation_id: string | null;
        };
        Insert: {
          battles_lost?: number | null;
          battles_total?: number | null;
          battles_won?: number | null;
          created_at?: string | null;
          dish_type_id: string;
          exif_location?: unknown;
          exif_timestamp?: string | null;
          id?: string;
          location_verified?: boolean | null;
          notes?: string | null;
          personal_elo?: number | null;
          photo_storage_path?: string | null;
          photo_url: string;
          raw_score: number;
          restaurant_id: string;
          updated_at?: string | null;
          user_id: string;
          variation_id?: string | null;
        };
        Update: {
          battles_lost?: number | null;
          battles_total?: number | null;
          battles_won?: number | null;
          created_at?: string | null;
          dish_type_id?: string;
          exif_location?: unknown;
          exif_timestamp?: string | null;
          id?: string;
          location_verified?: boolean | null;
          notes?: string | null;
          personal_elo?: number | null;
          photo_storage_path?: string | null;
          photo_url?: string;
          raw_score?: number;
          restaurant_id?: string;
          updated_at?: string | null;
          user_id?: string;
          variation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "personal_ratings_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_ratings_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_ratings_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "dish_type_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          credibility_score: number | null;
          display_name: string | null;
          expo_push_token: string | null;
          home_city_id: string | null;
          id: string;
          push_enabled: boolean | null;
          total_battles: number | null;
          total_ratings: number | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          credibility_score?: number | null;
          display_name?: string | null;
          expo_push_token?: string | null;
          home_city_id?: string | null;
          id: string;
          push_enabled?: boolean | null;
          total_battles?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          credibility_score?: number | null;
          display_name?: string | null;
          expo_push_token?: string | null;
          home_city_id?: string | null;
          id?: string;
          push_enabled?: boolean | null;
          total_battles?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey";
            columns: ["home_city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_dishes: {
        Row: {
          created_at: string | null;
          dish_type_id: string;
          first_rated_at: string | null;
          id: string;
          is_confirmed: boolean | null;
          photos: string[] | null;
          restaurant_id: string;
          source: string | null;
          total_ratings: number | null;
          updated_at: string | null;
          variation_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          dish_type_id: string;
          first_rated_at?: string | null;
          id?: string;
          is_confirmed?: boolean | null;
          photos?: string[] | null;
          restaurant_id: string;
          source?: string | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          variation_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          dish_type_id?: string;
          first_rated_at?: string | null;
          id?: string;
          is_confirmed?: boolean | null;
          photos?: string[] | null;
          restaurant_id?: string;
          source?: string | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          variation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_dishes_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_dishes_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "dish_type_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string | null;
          city_id: string | null;
          closed_at: string | null;
          coordinates: unknown;
          created_at: string | null;
          google_place_id: string | null;
          id: string;
          is_closed: boolean | null;
          is_verified: boolean | null;
          name: string;
          neighborhood_id: string | null;
          phone: string | null;
          types: string[] | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          city_id?: string | null;
          closed_at?: string | null;
          coordinates?: unknown;
          created_at?: string | null;
          google_place_id?: string | null;
          id?: string;
          is_closed?: boolean | null;
          is_verified?: boolean | null;
          name: string;
          neighborhood_id?: string | null;
          phone?: string | null;
          types?: string[] | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          city_id?: string | null;
          closed_at?: string | null;
          coordinates?: unknown;
          created_at?: string | null;
          google_place_id?: string | null;
          id?: string;
          is_closed?: boolean | null;
          is_verified?: boolean | null;
          name?: string;
          neighborhood_id?: string | null;
          phone?: string | null;
          types?: string[] | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurants_neighborhood_id_fkey";
            columns: ["neighborhood_id"];
            isOneToOne: false;
            referencedRelation: "neighborhoods";
            referencedColumns: ["id"];
          },
        ];
      };
      taste_tags: {
        Row: {
          created_at: string | null;
          dish_type_id: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          dish_type_id?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          dish_type_id?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taste_tags_dish_type_id_fkey";
            columns: ["dish_type_id"];
            isOneToOne: false;
            referencedRelation: "dish_types";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      anonymize_user_data: { Args: { p_user_id?: string }; Returns: Json };
      calculate_confidence_score: {
        Args: {
          p_total_battles: number;
          p_total_ratings: number;
          p_win_rate: number;
        };
        Returns: number;
      };
      calculate_expected_score: {
        Args: { elo_a: number; elo_b: number };
        Returns: number;
      };
      calculate_new_elo: {
        Args: {
          actual_result: number;
          current_elo: number;
          expected_score: number;
          k_factor?: number;
        };
        Returns: number;
      };
      calculate_new_elo_clamped: {
        Args: {
          actual_result: number;
          current_elo: number;
          expected_score: number;
          k_factor?: number;
        };
        Returns: number;
      };
      calculate_user_credibility: {
        Args: { target_user_id: string };
        Returns: number;
      };
      check_city_is_new: {
        Args: { p_city_id: string };
        Returns: {
          city_country: string;
          city_name: string;
          city_state: string;
          is_new: boolean;
        }[];
      };
      check_rate_limit: {
        Args: { p_user_id?: string };
        Returns: {
          can_rate: boolean;
          is_rate_limited: boolean;
          max_allowed: number;
          ratings_last_hour: number;
        }[];
      };
      check_user_skip_rate: {
        Args: { p_user_id?: string };
        Returns: {
          should_warn: boolean;
          skip_rate: number;
          skipped_count: number;
          total_comparisons: number;
        }[];
      };
      clamp_elo: { Args: { p_elo: number }; Returns: number };
      close_restaurant: { Args: { p_restaurant_id: string }; Returns: Json };
      create_rating: {
        Args: {
          p_dish_type_id: string;
          p_location_verified?: boolean;
          p_notes?: string;
          p_photo_storage_path?: string;
          p_photo_url: string;
          p_raw_score: number;
          p_restaurant_id: string;
          p_taste_tag_ids?: string[];
        };
        Returns: Json;
      };
      delete_user_account: { Args: { p_confirm?: boolean }; Returns: Json };
      find_comparison_candidate: {
        Args: {
          p_current_elo: number;
          p_current_rating_id: string;
          p_dish_type_id: string;
          p_user_id: string;
        };
        Returns: {
          candidate_elo: number;
          candidate_photo_url: string;
          candidate_rating_id: string;
          candidate_restaurant_name: string;
          candidate_score: number;
        }[];
      };
      find_nearby_restaurants: {
        Args: {
          p_lat: number;
          p_limit?: number;
          p_long: number;
          p_radius_meters?: number;
        };
        Returns: {
          address: string;
          city_id: string;
          closed_at: string;
          coordinates: unknown;
          created_at: string;
          distance_meters: number;
          google_place_id: string;
          id: string;
          is_closed: boolean;
          is_verified: boolean;
          name: string;
          neighborhood_id: string;
          phone: string;
          types: string[];
          updated_at: string;
          website: string;
        }[];
      };
      get_comparison_candidate: {
        Args: {
          p_dish_type_id: string;
          p_new_rating_id: string;
          p_new_raw_score: number;
          p_user_id: string;
        };
        Returns: string;
      };
      get_discover_heroes: {
        Args: {
          p_city_name?: string;
          p_min_battles?: number;
          p_radius_meters?: number;
          p_user_lat?: number;
          p_user_long?: number;
        };
        Returns: {
          avg_raw_score: number;
          city_id: string;
          confidence_score: number;
          dish_type_id: string;
          featured_photo_url: string;
          global_elo: number;
          id: string;
          neighborhood_id: string;
          neighborhood_name: string;
          restaurant_id: string;
          restaurant_name: string;
          total_battles: number;
          total_ratings: number;
        }[];
      };
      get_discover_rising_stars: {
        Args: {
          p_city_name?: string;
          p_max_battles?: number;
          p_min_ratings?: number;
          p_min_score?: number;
          p_radius_meters?: number;
          p_user_lat?: number;
          p_user_long?: number;
        };
        Returns: {
          avg_raw_score: number;
          city_id: string;
          confidence_score: number;
          dish_type_emoji: string;
          dish_type_id: string;
          dish_type_name: string;
          featured_photo_url: string;
          global_elo: number;
          id: string;
          neighborhood_id: string;
          neighborhood_name: string;
          restaurant_id: string;
          restaurant_name: string;
          total_battles: number;
          total_ratings: number;
        }[];
      };
      get_k_factor: { Args: { battles_total: number }; Returns: number };
      get_leaderboard: {
        Args: {
          p_city_id: string;
          p_dish_type_id: string;
          p_limit?: number;
          p_min_battles?: number;
          p_min_ratings?: number;
          p_neighborhood_id?: string;
        };
        Returns: {
          avg_raw_score: number;
          confidence_score: number;
          featured_photo_url: string;
          global_elo: number;
          neighborhood_name: string;
          rank: number;
          restaurant_id: string;
          restaurant_name: string;
          total_battles: number;
          total_ratings: number;
          win_rate: number;
        }[];
      };
      get_leaderboard_with_tiebreakers: {
        Args: { p_city_id: string; p_dish_type_id: string; p_limit?: number };
        Returns: {
          avg_raw_score: number;
          confidence_score: number;
          featured_photo_url: string;
          global_elo: number;
          neighborhood_name: string;
          rank: number;
          restaurant_id: string;
          restaurant_name: string;
          total_battles: number;
          total_ratings: number;
          win_rate: number;
        }[];
      };
      get_my_best_ever: {
        Args: { p_user_id?: string };
        Returns: {
          city_name: string;
          dish_type_emoji: string;
          dish_type_id: string;
          dish_type_name: string;
          personal_elo: number;
          photo_url: string;
          rated_at: string;
          rating_id: string;
          raw_score: number;
          restaurant_id: string;
          restaurant_name: string;
        }[];
      };
      get_my_dish_rankings: {
        Args: { p_dish_type_id: string; p_user_id?: string };
        Returns: {
          battles_total: number;
          city_name: string;
          personal_elo: number;
          photo_url: string;
          rank: number;
          rated_at: string;
          rating_id: string;
          raw_score: number;
          restaurant_id: string;
          restaurant_name: string;
        }[];
      };
      get_nearby_leaderboard: {
        Args: {
          p_dish_type_id: string;
          p_latitude: number;
          p_limit?: number;
          p_longitude: number;
          p_radius_meters?: number;
        };
        Returns: {
          confidence_score: number;
          distance_meters: number;
          featured_photo_url: string;
          global_elo: number;
          neighborhood_name: string;
          rank: number;
          restaurant_id: string;
          restaurant_name: string;
          total_battles: number;
        }[];
      };
      get_pending_comparisons: {
        Args: { p_limit?: number };
        Returns: {
          dish_type_id: string;
          dish_type_name: string;
          rating_a_id: string;
          rating_a_photo: string;
          rating_a_raw_score: number;
          rating_a_restaurant: string;
          rating_b_id: string;
          rating_b_photo: string;
          rating_b_raw_score: number;
          rating_b_restaurant: string;
        }[];
      };
      get_personal_dish_type_counts: {
        Args: { p_user_id?: string };
        Returns: Json;
      };
      get_user_stats: { Args: { p_user_id?: string }; Returns: Json };
      match_location: { Args: { lat: number; long: number }; Returns: Json };
      post_rating_and_get_duel: {
        Args: {
          p_dish_type_id: string;
          p_notes?: string;
          p_photo_url: string;
          p_raw_score: number;
          p_restaurant_id: string;
          p_taste_tag_ids?: string[];
          p_variation_id?: string;
        };
        Returns: Json;
      };
      process_comparison: {
        Args: {
          p_dish_type_id: string;
          p_rating_a_id: string;
          p_rating_b_id: string;
          p_skip_reason?: string;
          p_skipped?: boolean;
          p_winner_id?: string;
        };
        Returns: Json;
      };
      recalculate_global_scores: {
        Args: { p_city_id?: string; p_dish_type_id?: string };
        Returns: Json;
      };
      search_restaurants: {
        Args: { search_term: string };
        Returns: {
          address: string | null;
          city_id: string | null;
          closed_at: string | null;
          coordinates: unknown;
          created_at: string | null;
          google_place_id: string | null;
          id: string;
          is_closed: boolean | null;
          is_verified: boolean | null;
          name: string;
          neighborhood_id: string | null;
          phone: string | null;
          types: string[] | null;
          updated_at: string | null;
          website: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "restaurants";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      should_trigger_comparison: {
        Args: {
          p_dish_type_id: string;
          p_exclude_rating_id?: string;
          p_new_raw_score: number;
          p_user_id: string;
        };
        Returns: boolean;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      slugify: { Args: { v_text: string }; Returns: string };
      submit_comparison: {
        Args: { p_comparison_id: string; p_winner_rating_id: string };
        Returns: undefined;
      };
      update_existing_rating: {
        Args: {
          p_new_notes?: string;
          p_new_photo_url?: string;
          p_new_raw_score: number;
          p_rating_id: string;
          p_taste_tag_ids?: string[];
        };
        Returns: Json;
      };
      update_global_dish_score: {
        Args: { p_rating_id: string };
        Returns: undefined;
      };
      update_global_elo: {
        Args: {
          p_city_id: string;
          p_dish_type_id: string;
          p_restaurant_id: string;
          p_result: number;
          p_user_credibility?: number;
        };
        Returns: undefined;
      };
      upsert_restaurant_from_google: {
        Args: {
          p_address: string;
          p_city_name: string;
          p_country: string;
          p_google_place_id: string;
          p_lat?: number;
          p_lng?: number;
          p_name: string;
          p_neighborhood_name?: string;
          p_phone?: string;
          p_state: string;
          p_types?: string[];
          p_website?: string;
        };
        Returns: {
          address: string | null;
          city_id: string | null;
          closed_at: string | null;
          coordinates: unknown;
          created_at: string | null;
          google_place_id: string | null;
          id: string;
          is_closed: boolean | null;
          is_verified: boolean | null;
          name: string;
          neighborhood_id: string | null;
          phone: string | null;
          types: string[] | null;
          updated_at: string | null;
          website: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "restaurants";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      validate_comparison: {
        Args: { p_rating_a_id: string; p_rating_b_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
