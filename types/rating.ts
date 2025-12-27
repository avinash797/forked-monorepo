// Core Rating Flow Types

// ============================================================================
// Database Entity Types
// ============================================================================

export interface Venue {
  id: string;
  name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  latitude: number | null;
  longitude: number | null;
  cuisine_types: string[];
  is_chain: boolean;
  parent_chain_id: string | null;
  hours_of_operation: Record<string, any> | null;
  price_range: number | null;
  photos: string[];
  created_at: string;
  updated_at: string;
  added_by_user_id: string | null;
}

export interface Dish {
  id: string;
  venue_id: string;
  name: string;
  category: string;
  variety: string | null;
  current_price: number | null;
  currency: string;
  description: string | null;
  dietary_tags: string[];
  spice_level: number;
  photos: string[];
  is_available: boolean;
  date_added: string;
  updated_at: string;
  added_by_user_id: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  dish_id: string;
  venue_id: string;
  star_rating: number;
  review_text: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
  location_latitude: number | null;
  location_longitude: number | null;
  is_gps_verified: boolean;
  is_photo_verified: boolean;
  helpful_votes_count: number;
  moderation_status: 'pending' | 'approved' | 'flagged' | 'rejected';
  edit_history: Record<string, any>[] | null;
  flagged_reason: string | null;
  needs_human_review: boolean;
}

export interface Photo {
  id: string;
  uploaded_by_user_id: string;
  entity_type: 'review' | 'dish' | 'venue';
  entity_id: string;
  uploaded_at: string;
  storage_path: string;
  url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  ai_detected_dish_type: string | null;
  ai_confidence_score: number | null;
  exif_data: Record<string, any> | null;
  moderation_status: 'pending' | 'approved' | 'flagged' | 'rejected';
  flagged_reason: string | null;
  display_order: number;
}

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
  variety: string | null;
  current_price: number | null;
  description: string | null;
  dietary_tags: string[];
  spice_level: number;
}

export interface CreateReviewInput {
  dish_id: string;
  venue_id: string;
  star_rating: number;
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
