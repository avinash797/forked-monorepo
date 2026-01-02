// Core Rating Flow Types

import { Database } from "./database";

// ============================================================================
// Database Entity Types
// ============================================================================

export type Venue = Database['public']['Tables']['venues']['Row'];

export type DishType = Database['public']['Tables']['dish_types']['Row'];

export type Dish = Database['public']['Tables']['dishes']['Row'];

export type Review = Database['public']['Tables']['reviews']['Row'];

export type Photo = Database['public']['Tables']['photos']['Row'];

// ============================================================================
// Form Input Types
// ============================================================================

export interface CreateVenueInput {
  name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  latitude: number | null;
  longitude: number | null;
  cuisine_types: string[];
  price_range: number | null;
}

export interface CreateDishInput {
  venue_id: string;
  name: string;
  category: string;
  dish_type_id: string;
  variety: string | null;
  current_price: number | null;
  description: string | null;
  dietary_tags: string[];
  spice_level: number;
}

export interface CreateReviewInput {
  dish_id: string;
  venue_id: string;
  rating: number;
  review_text: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
}

// ============================================================================
// Location & GPS Types
// ============================================================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface GPSVerificationStatus {
  hasPermission: boolean;
  isVerified: boolean;
  distanceMeters: number | null;
  location: LocationCoordinates | null;
  error: string | null;
}

// ============================================================================
// Photo Upload Types
// ============================================================================

export interface UploadedPhoto {
  uri: string;
  storagePath: string;
  url: string;
}

// ============================================================================
// UI/Display Types
// ============================================================================

export interface VenueWithDistance extends Venue {
  distanceMeters?: number;
}

export interface DishWithVenue extends Dish {
  venue?: Venue;
}

export interface ReviewWithDetails extends Review {
  dish?: Dish;
  venue?: Venue;
  user_profile?: {
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
}
