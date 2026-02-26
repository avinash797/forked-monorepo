-- ============================================
-- EXTENSIONS (Most are already enabled in Supabase)
-- ============================================
-- PostGIS for geolocation (enable in Supabase Dashboard > Database > Extensions)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
-- For full-text search (already enabled by default)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ============================================
-- CITIES
-- ============================================
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT,
    country TEXT DEFAULT 'USA',
    slug TEXT UNIQUE NOT NULL,
    coordinates extensions.GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for slug lookups (deep links)
CREATE INDEX idx_cities_slug ON public.cities(slug);
CREATE INDEX idx_cities_active ON public.cities(is_active)
WHERE is_active = true;
COMMENT ON TABLE public.cities IS 'Cities where Forked is active';
-- ============================================
-- NEIGHBORHOODS
-- ============================================
CREATE TABLE public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    boundary extensions.GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(city_id, slug)
);
CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_id);
CREATE INDEX idx_neighborhoods_boundary ON public.neighborhoods USING GIST(boundary);
COMMENT ON TABLE public.neighborhoods IS 'Neighborhoods within cities for granular leaderboards';
-- ============================================
-- DISH TYPES
-- ============================================
CREATE TABLE public.dish_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    emoji TEXT,
    is_active BOOLEAN DEFAULT false,
    launch_order INTEGER,
    aliases TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_dish_types_active ON public.dish_types(is_active, launch_order)
WHERE is_active = true;
CREATE INDEX idx_dish_types_slug ON public.dish_types(slug);
COMMENT ON TABLE public.dish_types IS 'Controlled vocabulary of dish types (Gumbo, Po-boy, etc)';
-- ============================================
-- TASTE TAGS
-- ============================================
CREATE TABLE public.taste_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    dish_type_id UUID REFERENCES public.dish_types(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_taste_tags_dish_type ON public.taste_tags(dish_type_id);
COMMENT ON TABLE public.taste_tags IS 'Optional tags users can add to ratings (Dark roux, Spicy, etc)';
-- ============================================
-- RESTAURANTS
-- ============================================
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city_id UUID REFERENCES public.cities(id) ON DELETE
    SET NULL,
        neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE
    SET NULL,
        coordinates extensions.GEOGRAPHY(POINT, 4326),
        google_place_id TEXT UNIQUE,
        phone TEXT,
        website TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_closed BOOLEAN DEFAULT false,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_restaurants_name_trgm ON restaurants USING gin (name gin_trgm_ops);
CREATE INDEX idx_restaurants_city ON public.restaurants(city_id);
CREATE INDEX idx_restaurants_neighborhood ON public.restaurants(neighborhood_id);
CREATE INDEX idx_restaurants_coordinates ON public.restaurants USING GIST(coordinates);
CREATE INDEX idx_restaurants_google_place ON public.restaurants(google_place_id);
CREATE INDEX idx_restaurants_active ON public.restaurants(city_id)
WHERE is_closed = false;
COMMENT ON TABLE public.restaurants IS 'Restaurant locations, primarily sourced from Google Places';
-- ============================================
-- USER PROFILES
-- Extends Supabase auth.users
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    home_city_id UUID REFERENCES public.cities(id) ON DELETE
    SET NULL,
        bio TEXT,
        -- Stats (denormalized for performance)
        total_ratings INTEGER DEFAULT 0,
        total_battles INTEGER DEFAULT 0,
        credibility_score DECIMAL(3, 2) DEFAULT 1.00,
        -- Notifications
        expo_push_token TEXT,
        push_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_home_city ON public.profiles(home_city_id);
COMMENT ON TABLE public.profiles IS 'Extended user profiles linked to Supabase Auth';
-- ============================================
-- PERSONAL RATINGS
-- ============================================
CREATE TABLE public.personal_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    -- Photo (required)
    photo_url TEXT NOT NULL,
    photo_storage_path TEXT,
    -- Path in Supabase Storage
    -- Raw score (1-10)
    raw_score INTEGER NOT NULL CHECK (
        raw_score >= 1
        AND raw_score <= 10
    ),
    -- Personal Elo
    personal_elo DECIMAL(7, 2) DEFAULT 1500.00,
    -- Battle stats
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    battles_total INTEGER DEFAULT 0,
    -- Optional
    notes TEXT,
    -- Verification
    location_verified BOOLEAN DEFAULT false,
    exif_location extensions.GEOGRAPHY(POINT, 4326),
    exif_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- One rating per user per restaurant per dish type
    UNIQUE(user_id, restaurant_id, dish_type_id)
);
CREATE INDEX idx_ratings_user ON public.personal_ratings(user_id);
CREATE INDEX idx_ratings_user_dish ON public.personal_ratings(user_id, dish_type_id);
CREATE INDEX idx_ratings_user_elo ON public.personal_ratings(user_id, dish_type_id, personal_elo DESC);
CREATE INDEX idx_ratings_restaurant_dish ON public.personal_ratings(restaurant_id, dish_type_id);
COMMENT ON TABLE public.personal_ratings IS 'User ratings of dishes at restaurants';
-- ============================================
-- PERSONAL RATING TAGS (Junction Table)
-- ============================================
CREATE TABLE public.personal_rating_tags (
    rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.taste_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (rating_id, tag_id)
);
CREATE INDEX idx_rating_tags_rating ON public.personal_rating_tags(rating_id);
-- ============================================
-- COMPARISONS (Battle History)
-- ============================================
CREATE TABLE public.comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    -- The two ratings being compared
    rating_a_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    rating_b_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    -- Result
    winner_rating_id UUID REFERENCES public.personal_ratings(id) ON DELETE
    SET NULL,
        skipped BOOLEAN DEFAULT false,
        skip_reason TEXT CHECK (
            skip_reason IN ('not_tried', 'cant_remember', 'other')
        ),
        -- Elo audit trail
        rating_a_elo_before DECIMAL(7, 2),
        rating_a_elo_after DECIMAL(7, 2),
        rating_b_elo_before DECIMAL(7, 2),
        rating_b_elo_after DECIMAL(7, 2),
        created_at TIMESTAMPTZ DEFAULT now(),
        -- Prevent comparing same pair twice
        UNIQUE(user_id, rating_a_id, rating_b_id)
);
CREATE INDEX idx_comparisons_user ON public.comparisons(user_id);
CREATE INDEX idx_comparisons_user_dish ON public.comparisons(user_id, dish_type_id);
CREATE INDEX idx_comparisons_recent ON public.comparisons(user_id, created_at DESC);
COMMENT ON TABLE public.comparisons IS 'History of This vs That battles';
-- ============================================
-- GLOBAL DISH SCORES (Leaderboard)
-- ============================================
CREATE TABLE public.global_dish_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE
    SET NULL,
        -- Aggregated scores
        avg_raw_score DECIMAL(4, 2),
        total_ratings INTEGER DEFAULT 0,
        -- Global Elo
        global_elo DECIMAL(7, 2) DEFAULT 1500.00,
        -- Battle stats
        total_battles INTEGER DEFAULT 0,
        battles_won INTEGER DEFAULT 0,
        win_rate DECIMAL(5, 4) DEFAULT 0.0000,
        -- Confidence (determines leaderboard eligibility)
        confidence_score DECIMAL(6, 3) DEFAULT 0.000,
        -- Featured photo
        featured_photo_url TEXT,
        featured_rating_id UUID REFERENCES public.personal_ratings(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(restaurant_id, dish_type_id, city_id)
);
CREATE INDEX idx_global_scores_leaderboard ON public.global_dish_scores(city_id, dish_type_id, global_elo DESC);
CREATE INDEX idx_global_scores_neighborhood ON public.global_dish_scores(
    neighborhood_id,
    dish_type_id,
    global_elo DESC
)
WHERE neighborhood_id IS NOT NULL;
CREATE INDEX idx_global_scores_confidence ON public.global_dish_scores(
    city_id,
    dish_type_id,
    confidence_score DESC
);
COMMENT ON TABLE public.global_dish_scores IS 'Aggregated leaderboard scores per dish per restaurant';
