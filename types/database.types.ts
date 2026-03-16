export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      app_constants: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: number
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: number
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          dish_type_id: string | null
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          name: string
          rule_type: string
          slug: string
          sort_order: number
          threshold: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          dish_type_id?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          rule_type: string
          slug: string
          sort_order?: number
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          dish_type_id?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          rule_type?: string
          slug?: string
          sort_order?: number
          threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_definitions_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_sessions: {
        Row: {
          candidate_ids: string[]
          created_at: string | null
          current_step: number
          dish_type_id: string
          high_idx: number
          id: string
          low_idx: number
          rating_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidate_ids?: string[]
          created_at?: string | null
          current_step?: number
          dish_type_id: string
          high_idx?: number
          id?: string
          low_idx?: number
          rating_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidate_ids?: string[]
          created_at?: string | null
          current_step?: number
          dish_type_id?: string
          high_idx?: number
          id?: string
          low_idx?: number
          rating_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_sessions_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_sessions_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "personal_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          instagram_handle: string | null
          name: string
          slug: string
          twitter_handle: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_handle?: string | null
          name: string
          slug: string
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_handle?: string | null
          name?: string
          slug?: string
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          blog_post_id: string
          blog_tag_id: string
        }
        Insert: {
          blog_post_id: string
          blog_tag_id: string
        }
        Update: {
          blog_post_id?: string
          blog_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_blog_tag_id_fkey"
            columns: ["blog_tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string
          city_id: string | null
          content: Json | null
          created_at: string | null
          dish_type_id: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category_id: string
          city_id?: string | null
          content?: Json | null
          created_at?: string | null
          dish_type_id?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category_id?: string
          city_id?: string | null
          content?: Json | null
          created_at?: string | null
          dish_type_id?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          coordinates: unknown
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          coordinates?: unknown
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          coordinates?: unknown
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      city_known_dishes: {
        Row: {
          city_id: string
          created_at: string | null
          dish_type_id: string
          display_order: number | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          dish_type_id: string
          display_order?: number | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          dish_type_id?: string
          display_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_known_dishes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_known_dishes_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          created_at: string | null
          dish_type_id: string
          id: string
          k_factor_new: number
          k_factor_opponent: number
          new_elo_after: number
          new_elo_before: number
          new_rating_id: string
          opponent_elo_after: number
          opponent_elo_before: number
          opponent_rating_id: string
          result: string
          step_number: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dish_type_id: string
          id?: string
          k_factor_new: number
          k_factor_opponent: number
          new_elo_after: number
          new_elo_before: number
          new_rating_id: string
          opponent_elo_after: number
          opponent_elo_before: number
          opponent_rating_id: string
          result: string
          step_number?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          dish_type_id?: string
          id?: string
          k_factor_new?: number
          k_factor_opponent?: number
          new_elo_after?: number
          new_elo_before?: number
          new_rating_id?: string
          opponent_elo_after?: number
          opponent_elo_before?: number
          opponent_rating_id?: string
          result?: string
          step_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_new_rating_id_fkey"
            columns: ["new_rating_id"]
            isOneToOne: false
            referencedRelation: "personal_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_opponent_rating_id_fkey"
            columns: ["opponent_rating_id"]
            isOneToOne: false
            referencedRelation: "personal_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          reason: string | null
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      dish_type_variations: {
        Row: {
          created_at: string | null
          dish_type_id: string
          emoji: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          dish_type_id: string
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          dish_type_id?: string
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_type_variations_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_types: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          launch_order: number | null
          name: string
          placeholder_photo_url: string | null
          slug: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          launch_order?: number | null
          name: string
          placeholder_photo_url?: string | null
          slug: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          launch_order?: number | null
          name?: string
          placeholder_photo_url?: string | null
          slug?: string
        }
        Relationships: []
      }
      global_dish_scores: {
        Row: {
          bayesian_score: number | null
          city_id: string
          confidence_tier: string | null
          created_at: string | null
          dish_type_id: string
          featured_photo_url: string | null
          featured_rating_id: string | null
          id: string
          neighborhood_id: string | null
          raw_weighted_avg: number | null
          restaurant_id: string
          total_ratings: number | null
          updated_at: string | null
          weighted_rating_count: number
          weighted_score_sum: number
        }
        Insert: {
          bayesian_score?: number | null
          city_id: string
          confidence_tier?: string | null
          created_at?: string | null
          dish_type_id: string
          featured_photo_url?: string | null
          featured_rating_id?: string | null
          id?: string
          neighborhood_id?: string | null
          raw_weighted_avg?: number | null
          restaurant_id: string
          total_ratings?: number | null
          updated_at?: string | null
          weighted_rating_count?: number
          weighted_score_sum?: number
        }
        Update: {
          bayesian_score?: number | null
          city_id?: string
          confidence_tier?: string | null
          created_at?: string | null
          dish_type_id?: string
          featured_photo_url?: string | null
          featured_rating_id?: string | null
          id?: string
          neighborhood_id?: string | null
          raw_weighted_avg?: number | null
          restaurant_id?: string
          total_ratings?: number | null
          updated_at?: string | null
          weighted_rating_count?: number
          weighted_score_sum?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_dish_scores_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_dish_scores_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_dish_scores_featured_rating_id_fkey"
            columns: ["featured_rating_id"]
            isOneToOne: false
            referencedRelation: "personal_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_dish_scores_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_dish_scores_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          bayesian_score: number
          city_id: string
          confidence_tier: string | null
          created_at: string | null
          dish_type_id: string
          global_dish_score_id: string
          id: string
          neighborhood_id: string | null
          rank_position: number
          raw_weighted_avg: number | null
          restaurant_id: string
          scope: string
          snapshot_date: string
          total_ratings: number | null
        }
        Insert: {
          bayesian_score: number
          city_id: string
          confidence_tier?: string | null
          created_at?: string | null
          dish_type_id: string
          global_dish_score_id: string
          id?: string
          neighborhood_id?: string | null
          rank_position: number
          raw_weighted_avg?: number | null
          restaurant_id: string
          scope?: string
          snapshot_date: string
          total_ratings?: number | null
        }
        Update: {
          bayesian_score?: number
          city_id?: string
          confidence_tier?: string | null
          created_at?: string | null
          dish_type_id?: string
          global_dish_score_id?: string
          id?: string
          neighborhood_id?: string | null
          rank_position?: number
          raw_weighted_avg?: number | null
          restaurant_id?: string
          scope?: string
          snapshot_date?: string
          total_ratings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_global_dish_score_id_fkey"
            columns: ["global_dish_score_id"]
            isOneToOne: false
            referencedRelation: "global_dish_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          boundary: unknown
          city_id: string
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          boundary?: unknown
          city_id: string
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          boundary?: unknown
          city_id?: string
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_rating_tags: {
        Row: {
          created_at: string | null
          rating_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          rating_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          rating_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_rating_tags_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "personal_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_rating_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "taste_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_ratings: {
        Row: {
          battle_status: string
          comparison_count: number
          created_at: string | null
          derived_score: number | null
          dish_type_id: string
          elo_score: number
          exif_location: unknown
          exif_timestamp: string | null
          id: string
          location_verified: boolean | null
          notes: string | null
          photo_storage_path: string | null
          photo_url: string | null
          restaurant_id: string
          sentiment: string
          updated_at: string | null
          user_id: string
          variation_id: string | null
        }
        Insert: {
          battle_status?: string
          comparison_count?: number
          created_at?: string | null
          derived_score?: number | null
          dish_type_id: string
          elo_score?: number
          exif_location?: unknown
          exif_timestamp?: string | null
          id?: string
          location_verified?: boolean | null
          notes?: string | null
          photo_storage_path?: string | null
          photo_url?: string | null
          restaurant_id: string
          sentiment?: string
          updated_at?: string | null
          user_id: string
          variation_id?: string | null
        }
        Update: {
          battle_status?: string
          comparison_count?: number
          created_at?: string | null
          derived_score?: number | null
          dish_type_id?: string
          elo_score?: number
          exif_location?: unknown
          exif_timestamp?: string | null
          id?: string
          location_verified?: boolean | null
          notes?: string | null
          photo_storage_path?: string | null
          photo_url?: string | null
          restaurant_id?: string
          sentiment?: string
          updated_at?: string | null
          user_id?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_ratings_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_ratings_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "dish_type_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          created_at: string | null
          credibility_score: number | null
          display_name: string | null
          expo_push_token: string | null
          home_city_id: string | null
          id: string
          is_banned: boolean
          push_enabled: boolean | null
          role: string
          total_comparisons: number | null
          total_ratings: number | null
          updated_at: string | null
          username: string | null
          warn_count: number
          warned_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string | null
          credibility_score?: number | null
          display_name?: string | null
          expo_push_token?: string | null
          home_city_id?: string | null
          id: string
          is_banned?: boolean
          push_enabled?: boolean | null
          role?: string
          total_comparisons?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          username?: string | null
          warn_count?: number
          warned_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string | null
          credibility_score?: number | null
          display_name?: string | null
          expo_push_token?: string | null
          home_city_id?: string | null
          id?: string
          is_banned?: boolean
          push_enabled?: boolean | null
          role?: string
          total_comparisons?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          username?: string | null
          warn_count?: number
          warned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_dishes: {
        Row: {
          created_at: string | null
          dish_type_id: string
          first_rated_at: string | null
          id: string
          is_confirmed: boolean | null
          photos: string[] | null
          restaurant_id: string
          source: string | null
          total_ratings: number | null
          updated_at: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string | null
          dish_type_id: string
          first_rated_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          photos?: string[] | null
          restaurant_id: string
          source?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string | null
          dish_type_id?: string
          first_rated_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          photos?: string[] | null
          restaurant_id?: string
          source?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_dishes_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_dishes_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "dish_type_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city_id: string | null
          closed_at: string | null
          coordinates: unknown
          created_at: string | null
          google_place_id: string | null
          id: string
          is_closed: boolean | null
          is_verified: boolean | null
          location_properties: Json | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          types: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          closed_at?: string | null
          coordinates?: unknown
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          is_closed?: boolean | null
          is_verified?: boolean | null
          location_properties?: Json | null
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          types?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          closed_at?: string | null
          coordinates?: unknown
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          is_closed?: boolean | null
          is_verified?: boolean | null
          location_properties?: Json | null
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          types?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      taste_tags: {
        Row: {
          created_at: string | null
          dish_type_id: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          dish_type_id?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          dish_type_id?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "taste_tags_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          notified: boolean
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          notified?: boolean
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          notified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _update_global_dish_score: {
        Args: { p_dish_type_id: string; p_restaurant_id: string }
        Returns: undefined
      }
      _update_profile_stats: { Args: { p_user_id: string }; Returns: undefined }
      anonymize_user_data: { Args: { p_user_id?: string }; Returns: Json }
      award_badge_manual: {
        Args: { p_badge_slug: string; p_user_id: string }
        Returns: Json
      }
      check_city_is_new: {
        Args: { p_city_id: string }
        Returns: {
          city_country: string
          city_name: string
          city_state: string
          is_new: boolean
        }[]
      }
      check_rate_limit: {
        Args: { p_user_id?: string }
        Returns: {
          can_rate: boolean
          is_rate_limited: boolean
          max_allowed: number
          ratings_last_hour: number
        }[]
      }
      check_user_skip_rate: {
        Args: { p_user_id?: string }
        Returns: {
          should_warn: boolean
          skip_rate: number
          skipped_count: number
          total_comparisons: number
        }[]
      }
      close_restaurant: { Args: { p_restaurant_id: string }; Returns: Json }
      create_rating: {
        Args: {
          p_dish_type_id: string
          p_notes?: string
          p_photo_storage_path?: string
          p_photo_url?: string
          p_restaurant_id: string
          p_sentiment: string
          p_taste_tag_ids?: string[]
          p_variation_id?: string
        }
        Returns: Json
      }
      delete_user_account: { Args: { p_confirm?: boolean }; Returns: Json }
      evaluate_badges: { Args: { p_user_id: string }; Returns: Json }
      find_nearby_restaurants: {
        Args: {
          p_lat: number
          p_limit?: number
          p_long: number
          p_radius_meters?: number
        }
        Returns: {
          address: string
          city_id: string
          closed_at: string
          coordinates: unknown
          created_at: string
          distance_meters: number
          google_place_id: string
          id: string
          is_closed: boolean
          is_verified: boolean
          name: string
          neighborhood_id: string
          phone: string
          types: string[]
          updated_at: string
          website: string
        }[]
      }
      get_admin_city_breakdown: {
        Args: never
        Returns: {
          city_id: string
          city_name: string
          total_battles: number
          total_ratings: number
          total_restaurants: number
        }[]
      }
      get_admin_daily_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          day: string
          new_battles: number
          new_ratings: number
          new_users: number
        }[]
      }
      get_admin_dish_type_breakdown: {
        Args: never
        Returns: {
          avg_score: number
          dish_type_id: string
          dish_type_name: string
          total_battles: number
          total_ratings: number
        }[]
      }
      get_discover_heroes: {
        Args: {
          p_city_id?: string
          p_min_ratings?: number
          p_radius_meters?: number
          p_user_lat?: number
          p_user_long?: number
        }
        Returns: {
          bayesian_score: number
          city_id: string
          confidence_tier: string
          dish_type_id: string
          featured_photo_url: string
          id: string
          neighborhood_id: string
          neighborhood_name: string
          raw_weighted_avg: number
          restaurant_id: string
          restaurant_name: string
          total_ratings: number
        }[]
      }
      get_discover_rising_stars: {
        Args: {
          p_city_id?: string
          p_max_ratings?: number
          p_min_ratings?: number
          p_min_score?: number
          p_radius_meters?: number
          p_user_lat?: number
          p_user_long?: number
        }
        Returns: {
          bayesian_score: number
          city_id: string
          confidence_tier: string
          dish_type_emoji: string
          dish_type_icon: string
          dish_type_id: string
          dish_type_name: string
          featured_photo_url: string
          id: string
          neighborhood_id: string
          neighborhood_name: string
          raw_weighted_avg: number
          restaurant_id: string
          restaurant_name: string
          total_ratings: number
        }[]
      }
      get_dish_type_entry_counts: {
        Args: { p_city_id: string }
        Returns: {
          dish_type_id: string
          entry_count: number
        }[]
      }
      get_leaderboard: {
        Args: {
          p_city_id: string
          p_dish_type_id: string
          p_limit?: number
          p_neighborhood_id?: string
          p_offset?: number
        }
        Returns: Json
      }
      get_my_best_ever: {
        Args: { p_user_id?: string }
        Returns: {
          city_name: string
          derived_score: number
          dish_type_emoji: string
          dish_type_icon: string
          dish_type_id: string
          dish_type_name: string
          photo_url: string
          rated_at: string
          rating_id: string
          restaurant_id: string
          restaurant_name: string
          sentiment: string
        }[]
      }
      get_nearby_leaderboard: {
        Args: {
          p_dish_type_id: string
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_meters: number
        }
        Returns: {
          bayesian_score: number
          confidence_tier: string
          distance_meters: number
          featured_photo_url: string
          neighborhood_name: string
          rank: number
          raw_weighted_avg: number
          restaurant_id: string
          restaurant_name: string
          total_ratings: number
        }[]
      }
      get_personal_dish_type_counts: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_personal_rankings: {
        Args: { p_dish_type_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_rank_delta: {
        Args: {
          p_city_id: string
          p_dish_type_id: string
          p_period?: string
          p_restaurant_id: string
          p_scope?: string
        }
        Returns: Json
      }
      get_rank_history: {
        Args: {
          p_city_id: string
          p_days?: number
          p_dish_type_id: string
          p_restaurant_id: string
          p_scope?: string
        }
        Returns: Json
      }
      get_user_badges: { Args: { p_user_id?: string }; Returns: Json }
      get_user_stats: { Args: { p_user_id?: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      match_location: { Args: { lat: number; long: number }; Returns: Json }
      search_dish_types: {
        Args: { search_term: string }
        Returns: {
          aliases: string[] | null
          created_at: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          launch_order: number | null
          name: string
          placeholder_photo_url: string | null
          slug: string
        }[]
        SetofOptions: {
          from: "*"
          to: "dish_types"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_restaurant_dishes: {
        Args: { search_term: string }
        Returns: {
          dish_type_emoji: string
          dish_type_icon: string
          dish_type_id: string
          dish_type_name: string
          photos: string[]
          restaurant_dish_id: string
          restaurant_id: string
          restaurant_name: string
          total_ratings: number
        }[]
      }
      search_restaurants: {
        Args: { search_term: string }
        Returns: {
          address: string | null
          city_id: string | null
          closed_at: string | null
          coordinates: unknown
          created_at: string | null
          google_place_id: string | null
          id: string
          is_closed: boolean | null
          is_verified: boolean | null
          location_properties: Json | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          types: string[] | null
          updated_at: string | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "restaurants"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { v_text: string }; Returns: string }
      submit_comparison: {
        Args: { p_battle_id: string; p_result: string }
        Returns: Json
      }
      take_leaderboard_snapshot: {
        Args: { p_snapshot_date?: string }
        Returns: number
      }
      upsert_restaurant_from_google: {
        Args: {
          p_address: string
          p_city_name: string
          p_country: string
          p_google_place_id: string
          p_lat?: number
          p_lng?: number
          p_location_properties?: Json
          p_name: string
          p_neighborhood_name?: string
          p_phone?: string
          p_state: string
          p_types?: string[]
          p_website?: string
        }
        Returns: {
          address: string | null
          city_id: string | null
          closed_at: string | null
          coordinates: unknown
          created_at: string | null
          google_place_id: string | null
          id: string
          is_closed: boolean | null
          is_verified: boolean | null
          location_properties: Json | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          types: string[] | null
          updated_at: string | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "restaurants"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
