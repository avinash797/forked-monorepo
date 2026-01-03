# Database Migrations

This folder contains SQL migration files for the Supabase database schema.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project: https://bqxhinoabxmpsvzntrlq.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of a migration file and paste it
5. Click **Run** or press `Ctrl+Enter`

### Option 2: Using Supabase CLI (Recommended for Production)

1. Install Supabase CLI:

    ```bash
    npm install -g supabase
    ```

2. Link your project:

    ```bash
    supabase link --project-ref bqxhinoabxmpsvzntrlq
    ```

3. Run migrations:
    ```bash
    supabase db push
    ```

### Option 3: Manual Migration via API

You can also run migrations programmatically using the Supabase client, but this is not recommended for schema changes.

## Migration Files

Migrations are named with the format: `YYYYMMDDHHMMSS_description.sql`

### Current Migrations

- **20250101000000_create_profiles_table.sql**
    - Creates the `profiles` table
    - Sets up Row Level Security policies
    - Creates triggers for automatic profile creation on signup
    - Creates triggers for auto-updating timestamps
    - Adds indexes for performance

- **20250101000001_create_venues_table.sql**
    - Creates the `venues` table for restaurants/dining locations
    - Structured address fields (street, city, state, zip, country)
    - Coordinates for location verification (latitude/longitude)
    - Cuisine types as array
    - Chain support with self-referencing foreign key
    - Hours of operation as JSONB
    - Price range indicator (1-4)
    - RLS policies for public read, authenticated write
    - Indexes for name, location, cuisine search

- **20250101000002_create_dishes_table.sql**
    - Creates the `dishes` table for menu items
    - Foreign key to venues table
    - Category and variety fields
    - Price caching for quick access
    - Dietary tags array (vegetarian, vegan, gluten-free, etc.)
    - Spice level indicator (0-5)
    - Availability status
    - RLS policies for public read, authenticated write
    - Indexes for venue lookups, category, dietary filters

- **20250101000003_create_dish_types_table.sql**
    - Creates the `dish_types` table for normalized dish definitions
    - Enables cross-venue queries (e.g., "all Gumbos in New Orleans")
    - Unique constraint on name + category
    - Alternate names array for search flexibility
    - Common dietary tags for each dish type
    - RLS policies for public read, authenticated write
    - Includes example dish types (Gumbo, Lobster Roll, etc.)

- **20250101000004_create_price_history_table.sql**
    - Creates the `price_history` table for tracking price changes
    - Foreign key to dishes with cascade delete
    - Source tracking (user-reported, restaurant-updated, admin-verified)
    - Verification system with verifier tracking
    - Automatic sync to dishes.current_price via triggers
    - Helper function to get current verified price
    - RLS policies for public read, authenticated write
    - Indexes for time-series queries

- **20250101000005_add_dish_type_to_dishes.sql**
    - Adds `dish_type_id` foreign key to dishes table
    - Links venue-specific dishes to normalized dish types
    - Composite indexes for efficient cross-venue queries
    - Helper function `find_dishes_by_type()` for searching
    - Enables queries like "all instances of Gumbo across venues"

- **20250101000006_create_reviews_table.sql**
    - Creates the `reviews` table for user ratings and reviews
    - Star rating (1-5) with optional review text
    - GPS location verification (coordinates + validation function)
    - Verification flags (GPS, photo, human review)
    - Helpful votes counter with automatic sync
    - Edit history tracking in JSONB
    - Moderation status workflow
    - Unique constraint: one review per user per dish
    - Helper function `verify_review_gps()` to check location accuracy

- **20250101000007_create_photos_table.sql**
    - Creates the `photos` table with polymorphic associations
    - Can associate with review, dish, or venue
    - Polymorphic validation via trigger
    - AI verification support (dish type detection, confidence score)
    - EXIF data storage (camera metadata, location)
    - Moderation workflow (pending, approved, flagged, rejected)
    - Helper function `get_entity_photos()` for querying
    - Display ordering support

- **20250101000008_create_helpful_votes_table.sql**
    - Creates the `helpful_votes` table to track review helpfulness
    - Prevents duplicate votes (composite PK: user + review)
    - Automatic sync to `reviews.helpful_votes_count` via triggers
    - Constraint prevents self-voting
    - Helper function `get_top_helpful_reviews()` for ranking
    - Future support for negative votes (-1 value)

- **20250101000009_create_charms_table.sql**
    - Creates the `charms` table for gamification/achievements
    - Unlock criteria stored as JSONB (flexible requirements)
    - Rarity tiers (common, uncommon, rare, epic, legendary)
    - Includes 10 example charms (The OG, Taco King, etc.)
    - Support for both icon URLs and inline SVG
    - Display order and active status management

- **20250101000010_create_user_charms_table.sql**
    - Creates the `user_charms` junction table
    - Tracks which users earned which charms
    - Progress tracking in JSONB for incremental charms
    - Featured charm support for profiles
    - `grant_charm()` function for safe charm awarding
    - `check_and_grant_charms()` automatically evaluates criteria
    - Automatic charm checking on review creation (trigger)
    - Helper function `get_user_charms()` for profile display
    - Prevents deletion (charms are permanent)

## Schema Overview

### `public.profiles`

User profile information that extends `auth.users`.

**Key Features:**

- Automatically created when user signs up (via trigger)
- RLS enabled for data protection
- Public read access, users can only edit their own profile
- Includes username, location, bio, verification status, charms, and reputation

**Columns:**

- `id` (uuid, PK) - References auth.users.id
- `username` (text, unique) - Optional unique username
- `display_name` (text) - Display name
- `email` (text, unique, required) - User's email
- `location` (text) - Home city/region
- `created_at` (timestamp) - Account creation date
- `phone_verified` (boolean) - Phone verification status
- `email_verified` (boolean) - Email verification status
- `charms` (jsonb) - Array of earned charms
- `reputation_score` (integer) - User reputation
- `profile_photo_url` (text) - Profile photo URL
- `bio` (text) - User bio
- `updated_at` (timestamp) - Last update timestamp

### `public.venues`

Restaurant and dining venue information.

**Key Features:**

- Public read access for all users
- Authenticated users can add new venues
- Structured address with geocoding coordinates
- Flexible cuisine types and hours storage
- Chain relationship support

**Columns:**

- `id` (uuid, PK) - Unique venue identifier
- `name` (text, required) - Venue name
- `address_street` (text, required) - Street address
- `address_city` (text, required) - City
- `address_state` (text, required) - State/province
- `address_zip` (text, required) - Postal code
- `address_country` (text) - Country (default: USA)
- `latitude` (decimal) - Latitude coordinate
- `longitude` (decimal) - Longitude coordinate
- `cuisine_types` (text[]) - Array of cuisine types
- `is_chain` (boolean) - Chain indicator
- `parent_chain_id` (uuid, FK) - Self-reference for chain parent
- `hours_of_operation` (jsonb) - Operating hours by day
- `price_range` (integer) - Price range 1-4 ($-$$$$)
- `photos` (text[]) - Array of photo URLs
- `created_at` (timestamp) - Date added to platform
- `updated_at` (timestamp) - Last update timestamp
- `added_by_user_id` (uuid, FK) - User who added venue

### `public.dishes`

Menu items available at venues.

**Key Features:**

- Public read access for all users
- Authenticated users can add new dishes
- Cascading delete when venue is removed
- Rich dietary and availability metadata
- Cached pricing for performance

**Columns:**

- `id` (uuid, PK) - Unique dish identifier
- `venue_id` (uuid, FK, required) - Parent venue
- `name` (text, required) - Dish name
- `category` (text, required) - Dish category (appetizer, entree, etc.)
- `variety` (text) - Optional variety/specification
- `current_price` (decimal) - Current price
- `currency` (text) - Currency code (default: USD)
- `description` (text) - Dish description
- `dietary_tags` (text[]) - Array of dietary tags
- `spice_level` (integer) - Spiciness level 0-5
- `photos` (text[]) - Array of photo URLs
- `is_available` (boolean) - Availability status
- `date_added` (timestamp) - Date added to platform
- `updated_at` (timestamp) - Last update timestamp
- `added_by_user_id` (uuid, FK) - User who added dish
- `dish_type_id` (uuid, FK) - Reference to normalized dish type

### `public.dish_types`

Normalized dish type definitions for cross-venue queries.

**Key Features:**

- Enables queries like "all Gumbos in New Orleans"
- Unique constraint on name + category (case-insensitive)
- Alternate names for search flexibility
- Public read access for all users
- Authenticated users can add new dish types

**Columns:**

- `id` (uuid, PK) - Unique dish type identifier
- `name` (text, required) - Canonical dish name (e.g., "Gumbo")
- `category` (text, required) - Dish category
- `description` (text) - Description of this dish type
- `alternate_names` (text[]) - Array of alternate spellings/names
- `common_dietary_tags` (text[]) - Common dietary tags for this type
- `created_at` (timestamp) - Date added
- `updated_at` (timestamp) - Last update timestamp
- `created_by_user_id` (uuid, FK) - User who created this type

**Example Query:**

```sql
-- Find all Gumbos in New Orleans
SELECT * FROM find_dishes_by_type(
  (SELECT id FROM dish_types WHERE name = 'Gumbo'),
  'New Orleans'
);
```

### `public.price_history`

Historical price tracking with crowd-sourced verification.

**Key Features:**

- Track price trends over time
- Multiple sources (user-reported, restaurant-updated, admin-verified)
- Verification system to ensure accuracy
- Automatic sync to dishes.current_price
- Enables future features (price alerts, value rankings)

**Columns:**

- `id` (uuid, PK) - Unique price history entry
- `dish_id` (uuid, FK, required) - Reference to dish
- `price` (decimal, required) - Price value
- `currency` (text) - Currency code (default: USD)
- `recorded_at` (timestamp) - When price was observed
- `reported_by_user_id` (uuid, FK) - User who reported (null if official)
- `source` (text, required) - Source type (user-reported, restaurant-updated, admin-verified, menu-scrape)
- `notes` (text) - Optional notes
- `is_verified` (boolean) - Verification status
- `verified_by_user_id` (uuid, FK) - User who verified
- `verified_at` (timestamp) - When verified
- `created_at` (timestamp) - Entry creation date

**Automatic Features:**

- Trigger automatically updates `dishes.current_price` when verified price is added
- Helper function `get_current_dish_price(dish_id)` returns most recent verified price

**Data Integrity:**

- Users can only create user-reported entries with their own ID
- Users can update/delete their own unverified reports
- Verified entries are locked from modification

### `public.reviews`

User ratings and reviews of dishes.

**Key Features:**

- One review per user per dish (unique constraint)
- Star rating (1-5) with optional review text
- GPS location verification with distance calculation
- Moderation workflow (pending, approved, flagged, rejected)
- Edit history tracking in JSONB
- Helpful votes counter (automatically synced)
- Verification flags for GPS, photos, and manual review

**Columns:**

- `id` (uuid, PK) - Unique review identifier
- `user_id` (uuid, FK, required) - Reviewer
- `dish_id` (uuid, FK, required) - Dish being reviewed
- `venue_id` (uuid, FK, required) - Venue (redundant for performance)
- `star_rating` (integer, required) - Rating 1-5
- `review_text` (text) - Optional review text
- `photo_urls` (text[]) - Array of photo URLs (legacy, use photos table)
- `created_at` (timestamp) - Review creation date
- `updated_at` (timestamp) - Last update timestamp
- `location_latitude` (decimal) - GPS latitude when submitted
- `location_longitude` (decimal) - GPS longitude when submitted
- `is_gps_verified` (boolean) - User was at venue location
- `is_photo_verified` (boolean) - AI confirmed dish from photos
- `needs_human_review` (boolean) - Flagged for manual check
- `helpful_votes_count` (integer) - Count of helpful votes
- `edit_history` (jsonb) - Array of edit records
- `moderation_status` (enum) - pending, approved, flagged, rejected
- `flagged_reason` (text) - Reason if flagged/rejected

**Helper Functions:**

- `verify_review_gps(review_id, max_distance_meters)` - Check if review location is near venue

### `public.photos`

Photos with polymorphic associations to reviews, dishes, or venues.

**Key Features:**

- Polymorphic entity association (review/dish/venue)
- AI-powered dish type detection
- EXIF metadata storage
- Moderation workflow
- Display ordering support
- Validated entity references via trigger

**Columns:**

- `id` (uuid, PK) - Unique photo identifier
- `uploaded_by_user_id` (uuid, FK, required) - Uploader
- `entity_type` (enum, required) - review, dish, or venue
- `entity_id` (uuid, required) - ID of associated entity
- `uploaded_at` (timestamp) - Upload timestamp
- `storage_path` (text, required) - Storage path
- `url` (text, required) - Public URL
- `file_size_bytes` (integer) - File size
- `mime_type` (text) - MIME type
- `width` (integer) - Image width
- `height` (integer) - Image height
- `moderation_status` (enum) - pending, approved, flagged, rejected
- `flagged_reason` (text) - Reason if flagged/rejected
- `ai_detected_dish_type` (text) - AI-detected dish type
- `ai_confidence_score` (decimal) - AI confidence (0.00-1.00)
- `exif_data` (jsonb) - EXIF metadata (camera, location, etc.)
- `display_order` (integer) - Display order for sorting

**Helper Functions:**

- `get_entity_photos(entity_type, entity_id, limit)` - Get approved photos for an entity

### `public.helpful_votes`

Tracks which users found reviews helpful.

**Key Features:**

- Prevents duplicate votes (composite PK)
- Automatic sync to reviews.helpful_votes_count
- Prevents self-voting (constraint)
- Future support for negative votes

**Columns:**

- `user_id` (uuid, FK, PK) - User who voted
- `review_id` (uuid, FK, PK) - Review being voted on
- `vote_value` (integer) - 1 for helpful, -1 for not helpful (future)
- `voted_at` (timestamp) - When vote was cast

**Helper Functions:**

- `user_voted_helpful(user_id, review_id)` - Check if user voted
- `get_top_helpful_reviews(dish_id, limit)` - Get top-rated reviews for a dish

### `public.charms`

Achievements/badges users can earn.

**Key Features:**

- JSONB unlock criteria for flexible requirements
- Rarity tiers (common → legendary)
- Includes 10 starter charms
- Support for icon URLs or inline SVG
- Active/inactive status management

**Columns:**

- `id` (uuid, PK) - Unique charm identifier
- `name` (text, unique, required) - Charm name
- `description` (text, required) - Description
- `icon_url` (text) - Icon URL
- `icon_svg` (text) - Inline SVG icon
- `unlock_criteria` (jsonb, required) - Requirements to unlock
- `rarity_tier` (enum, required) - common, uncommon, rare, epic, legendary
- `display_order` (integer) - Display order
- `is_active` (boolean) - Currently available to earn
- `created_at` (timestamp) - Created date
- `updated_at` (timestamp) - Last update

**Example Charms:**

- The OG (legendary) - Early adopter
- First Review (common) - Posted first review
- Review Veteran (epic) - 100+ reviews
- Taco King (rare) - 20+ taco reviews
- Seafood Connoisseur (rare) - 30+ seafood reviews
- City Explorer (epic) - 10+ cities
- Helpful Reviewer (rare) - 100+ helpful votes
- Photographer (uncommon) - 50+ photos
- 5-Star Finder (rare) - 20 five-star reviews
- Price Detective (uncommon) - 50+ verified price reports

### `public.user_charms`

Junction table tracking user-earned charms.

**Key Features:**

- Permanent charm awards (no deletion)
- Progress tracking for incremental charms
- Featured charm support for profiles
- Automatic charm checking on review creation
- Safe charm granting via functions only

**Columns:**

- `user_id` (uuid, FK, PK) - User who earned charm
- `charm_id` (uuid, FK, PK) - Charm earned
- `unlocked_at` (timestamp) - When earned
- `progress` (jsonb) - Progress toward unlock
- `is_featured` (boolean) - Featured on profile

**Helper Functions:**

- `grant_charm(user_id, charm_id)` - Award charm to user (idempotent)
- `check_and_grant_charms(user_id)` - Check all criteria and award matching charms
- `get_user_charms(user_id)` - Get user's earned charms with details

**Automatic Triggers:**

- Checks and awards charms automatically when user posts a review

## Best Practices

1. **Never delete migrations** - Always create new migrations to modify schema
2. **Test locally first** - If using Supabase CLI, test with `supabase db reset` locally
3. **Backup before running** - Always backup your database before running migrations in production
4. **Version control** - Keep migrations in git for team collaboration

## Rollback

To rollback a migration, create a new migration that reverses the changes. For example:

```sql
-- Rollback: Drop profiles table
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_updated on public.profiles;
drop function if exists public.handle_new_user();
drop function if exists public.handle_updated_at();
drop table if exists public.profiles;
```

## Database Relationships

```
┌─────────────┐
│  profiles   │ (users)
└──────┬──────┘
       │
       ├─────→ venues (added_by_user_id)
       │         │
       │         └──→ dishes (venue_id) ←──┐
       │               │                    │
       │               ├──→ dish_types (dish_type_id)
       │               │
       │               ├──→ price_history (dish_id)
       │               │
       │               └──→ reviews (dish_id)
       │                      │
       ├─────→ reviews (user_id)
       │         │
       │         ├──→ helpful_votes (review_id)
       │         │
       │         └──→ photos (entity_id where entity_type='review')
       │
       ├─────→ helpful_votes (user_id)
       │
       ├─────→ photos (uploaded_by_user_id)
       │         │
       │         ├──→ reviews/dishes/venues (polymorphic: entity_type + entity_id)
       │
       ├─────→ price_history (reported_by_user_id)
       │
       └─────→ user_charms (user_id)
                 │
                 └──→ charms (charm_id)

Key Relationships:
- User → Venues (added venues)
- User → Reviews (written reviews)
- User → Photos (uploaded photos)
- User → Helpful Votes (voted on reviews)
- User → Price History (reported prices)
- User → User Charms (earned achievements)
- Venue → Dishes (menu items)
- Dish → Dish Type (normalized dish name)
- Dish → Reviews (dish ratings)
- Dish → Price History (price changes)
- Review → Helpful Votes (helpfulness votes)
- Photos → Review/Dish/Venue (polymorphic association)
```

## Future Migrations

Potential future enhancements:

- `followers` table - User follow relationships (social features)
- `notifications` table - User notification system (in-app notifications)
- `tags` table - User-generated tags for venues/dishes
- `lists` table - User-created lists (e.g., "Best Tacos in LA")
- `list_items` table - Items in user lists
- `bookmarks` table - Saved venues/dishes for later
- `check_ins` table - User check-ins at venues
- `dish_reports` table - User reports for incorrect dish info
- Advanced search:
    - Full-text search indexes using tsvector
    - Geospatial indexes using PostGIS for location queries
- Aggregated views:
    - Materialized view for trending dishes (by recent review count)
    - Materialized view for top-rated venues by city
    - Materialized view for dish average ratings
- Analytics tables:
    - User activity metrics
    - Venue popularity trends
    - Price trend analysis
- Admin features:
    - Moderation queue views
    - User reports/flags
    - Content approval workflows
