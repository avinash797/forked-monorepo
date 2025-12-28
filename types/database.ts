import type { Profile, Charm } from './auth';
import type { Venue, Dish, Review, Photo } from './rating';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'reputation_score' | 'charms' | 'phone_verified' | 'email_verified'> & {
          reputation_score?: number;
          charms?: Charm[];
          phone_verified?: boolean;
          email_verified?: boolean;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'email'>>;
      };
      venues: {
        Row: Venue;
        Insert: Omit<Venue, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Venue, 'id' | 'created_at'>>;
      };
      dishes: {
        Row: Dish;
        Insert: Omit<Dish, 'id' | 'date_added' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Dish, 'id' | 'venue_id' | 'date_added'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'helpful_votes_count' | 'edit_history' | 'needs_human_review'> & {
          id?: string;
          helpful_votes_count?: number;
          edit_history?: Record<string, any>[];
          needs_human_review?: boolean;
        };
        Update: Partial<Omit<Review, 'id' | 'user_id' | 'dish_id' | 'venue_id' | 'created_at'>>;
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'uploaded_at' | 'ai_detected_dish_type' | 'ai_confidence_score'> & {
          id?: string;
          ai_detected_dish_type?: string | null;
          ai_confidence_score?: number | null;
        };
        Update: Partial<Omit<Photo, 'id' | 'uploaded_by_user_id' | 'entity_type' | 'entity_id' | 'uploaded_at'>>;
      };
    };
  };
}
