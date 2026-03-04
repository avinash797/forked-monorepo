-- =============================================================================
-- DRAFT MIGRATION 1: Extensions and Tables
--
-- Clean consolidated schema for Forked — sentiment + binary insertion sort
-- rating system for New Orleans dish rankings.
--
-- Run order: 1 of 4
-- =============================================================================
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_net;
-- ============================================================
-- CITIES
-- ============================================================
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT,
    country TEXT DEFAULT 'USA',
    slug TEXT UNIQUE NOT NULL,
    coordinates extensions.GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (name, state)
);
CREATE INDEX idx_cities_slug ON public.cities(slug);
CREATE INDEX idx_cities_active ON public.cities(is_active)
WHERE is_active = true;
-- ============================================================
-- NEIGHBORHOODS
-- ============================================================
CREATE TABLE public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    boundary extensions.GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (city_id, slug)
);
CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_id);
CREATE INDEX idx_neighborhoods_boundary ON public.neighborhoods USING GIST(boundary);
-- ============================================================
-- DISH TYPES
-- ============================================================
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
-- ============================================================
-- TASTE TAGS
-- ============================================================
CREATE TABLE public.taste_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    dish_type_id UUID REFERENCES public.dish_types(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_taste_tags_dish_type ON public.taste_tags(dish_type_id);
-- ============================================================
-- DISH TYPE VARIATIONS
-- ============================================================
CREATE TABLE public.dish_type_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    emoji TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_dish_type_variations_dish_type ON public.dish_type_variations(dish_type_id);
-- ============================================================
-- RESTAURANTS
-- ============================================================
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
        types TEXT [] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_restaurants_name_trgm ON public.restaurants USING gin(name gin_trgm_ops);
CREATE INDEX idx_restaurants_city ON public.restaurants(city_id);
CREATE INDEX idx_restaurants_neighborhood ON public.restaurants(neighborhood_id);
CREATE INDEX idx_restaurants_coordinates ON public.restaurants USING GIST(coordinates);
CREATE INDEX idx_restaurants_google_place ON public.restaurants(google_place_id);
CREATE INDEX idx_restaurants_active ON public.restaurants(city_id)
WHERE is_closed = false;
-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    home_city_id UUID REFERENCES public.cities(id) ON DELETE
    SET NULL,
        bio TEXT,
        -- Denormalized stats
        total_ratings INTEGER DEFAULT 0,
        total_comparisons INTEGER DEFAULT 0,
        credibility_score DECIMAL(3, 2) DEFAULT 0.00,
        -- Notifications
        expo_push_token TEXT,
        push_enabled BOOLEAN DEFAULT true,
        -- Admin / moderation
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_banned BOOLEAN NOT NULL DEFAULT false,
        banned_at TIMESTAMPTZ,
        ban_reason TEXT,
        warn_count INTEGER NOT NULL DEFAULT 0,
        warned_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_home_city ON public.profiles(home_city_id);
-- ============================================================
-- PERSONAL RATINGS
-- ============================================================
CREATE TABLE public.personal_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    -- Photo (mandatory)
    photo_url TEXT NOT NULL,
    photo_storage_path TEXT,
    -- Sentiment + ranking
    sentiment TEXT NOT NULL DEFAULT 'liked' CHECK (sentiment IN ('liked', 'okay', 'disliked')),
    elo_score NUMERIC NOT NULL DEFAULT 1500,
    derived_score NUMERIC GENERATED ALWAYS AS (
        ROUND(((LEAST(GREATEST(elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1)
    ) STORED,
    comparison_count INTEGER NOT NULL DEFAULT 0,
    battle_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (battle_status IN ('pending', 'in_progress', 'completed')),
    -- Optional
    notes TEXT,
    variation_id UUID REFERENCES public.dish_type_variations(id) ON DELETE
    SET NULL,
        -- Verification
        location_verified BOOLEAN DEFAULT false,
        exif_location extensions.GEOGRAPHY(POINT, 4326),
        exif_timestamp TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        -- One rating per user per restaurant per dish type
        UNIQUE (user_id, restaurant_id, dish_type_id)
);
CREATE INDEX idx_ratings_user ON public.personal_ratings(user_id);
CREATE INDEX idx_ratings_user_dish ON public.personal_ratings(user_id, dish_type_id);
CREATE INDEX idx_ratings_restaurant_dish ON public.personal_ratings(restaurant_id, dish_type_id);
-- For binary search zone selection: fetch user's ratings in a dish type within an Elo range
CREATE INDEX idx_ratings_user_dish_elo
    ON public.personal_ratings(user_id, dish_type_id, elo_score DESC);

-- For leaderboard aggregation: all ratings for a restaurant+dish combo
CREATE INDEX idx_ratings_restaurant_dish_elo
    ON public.personal_ratings(restaurant_id, dish_type_id, elo_score DESC);

-- For finding active battles
CREATE INDEX idx_ratings_battle_status
    ON public.personal_ratings(user_id, battle_status)
    WHERE battle_status = 'in_progress';
-- ============================================================
-- PERSONAL RATING TAGS (junction)
-- ============================================================
CREATE TABLE public.personal_rating_tags (
    rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.taste_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (rating_id, tag_id)
);
CREATE INDEX idx_rating_tags_rating ON public.personal_rating_tags(rating_id);
-- ============================================================
-- COMPARISONS (Binary insertion sort battle history)
-- ============================================================
CREATE TABLE public.comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,

    -- The rating being placed (the "new" dish in the battle)
    new_rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    -- The opponent it was compared against
    opponent_rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,

    -- Result
    result TEXT NOT NULL CHECK (result IN ('new_wins', 'opponent_wins', 'skipped')),

    -- Elo snapshot (for auditability and debugging)
    new_elo_before NUMERIC NOT NULL,
    new_elo_after NUMERIC NOT NULL,
    opponent_elo_before NUMERIC NOT NULL,
    opponent_elo_after NUMERIC NOT NULL,
    k_factor_new NUMERIC NOT NULL,
    k_factor_opponent NUMERIC NOT NULL,

    -- Binary search state at time of comparison
    step_number INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT now(),

    -- FK for PostgREST join
    CONSTRAINT comparisons_user_profile_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE INDEX idx_comparisons_user_dish ON public.comparisons(user_id, dish_type_id);
CREATE INDEX idx_comparisons_new_rating ON public.comparisons(new_rating_id, created_at DESC);
CREATE INDEX idx_comparisons_opponent_rating ON public.comparisons(opponent_rating_id);
CREATE INDEX idx_comparisons_recent ON public.comparisons(user_id, created_at DESC);
-- ============================================================
-- GLOBAL DISH SCORES (Leaderboard)
-- ============================================================
CREATE TABLE public.global_dish_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE
    SET NULL,
        -- Aggregated scores (Bayesian)
        raw_weighted_avg NUMERIC,
        weighted_score_sum NUMERIC NOT NULL DEFAULT 0,
        weighted_rating_count NUMERIC NOT NULL DEFAULT 0,
        total_ratings INTEGER DEFAULT 0,
        bayesian_score NUMERIC,
        confidence_tier TEXT DEFAULT 'low' CHECK (
            confidence_tier IN ('low', 'medium', 'high', 'very_high')
        ),
        -- Featured photo
        featured_photo_url TEXT,
        featured_rating_id UUID REFERENCES public.personal_ratings(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (restaurant_id, dish_type_id)
);
CREATE INDEX idx_global_scores_leaderboard ON public.global_dish_scores(city_id, dish_type_id, bayesian_score DESC);
CREATE INDEX idx_global_scores_neighborhood ON public.global_dish_scores(
    neighborhood_id,
    dish_type_id,
    bayesian_score DESC
)
WHERE neighborhood_id IS NOT NULL;
-- ============================================================
-- BATTLE STATE
-- ============================================================
CREATE TABLE public.battle_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,

    -- The ordered list of candidate opponent rating IDs (by Elo) for binary search
    candidate_ids UUID[] NOT NULL DEFAULT '{}',

    -- Binary search pointers
    low_idx INTEGER NOT NULL DEFAULT 0,
    high_idx INTEGER NOT NULL DEFAULT 0,
    current_step INTEGER NOT NULL DEFAULT 1,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_battle_sessions_active
    ON public.battle_sessions(user_id, status)
    WHERE status = 'active';

CREATE UNIQUE INDEX idx_battle_sessions_one_active_per_rating
    ON public.battle_sessions(rating_id)
    WHERE status = 'active';
-- ============================================================
-- APP CONSTANTS
-- ============================================================
CREATE TABLE public.app_constants (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.app_constants (key, value, description) VALUES
    ('ELO_INITIAL_LIKED',    1800,  'Starting Elo for "loved it" sentiment'),
    ('ELO_INITIAL_OKAY',     1500,  'Starting Elo for "it was fine" sentiment'),
    ('ELO_INITIAL_DISLIKED', 1200,  'Starting Elo for "didn''t like it" sentiment'),
    ('ELO_MIN',              1000,  'Minimum Elo (clamped)'),
    ('ELO_MAX',              2000,  'Maximum Elo (clamped)'),
    ('K_MAX',                64,    'Maximum K-factor for new dishes'),
    ('K_DECAY',              0.15,  'K-factor decay rate'),
    ('CREDIBILITY_SCALE',    500,   'Logarithmic credibility normalization constant'),
    ('BAYESIAN_C',           5,     'Bayesian prior strength (phantom votes)'),
    ('ZONE_LIKED_MIN',       1600,  'Lower Elo bound for "liked" search zone'),
    ('ZONE_OKAY_MIN',        1200,  'Lower Elo bound for "okay" search zone'),
    ('ZONE_OKAY_MAX',        1800,  'Upper Elo bound for "okay" search zone'),
    ('ZONE_DISLIKED_MAX',    1400,  'Upper Elo bound for "disliked" search zone'),
    -- Per-sentiment Elo clamp boundaries (enforced after each comparison)
    ('ELO_CLAMP_LIKED_MIN',    1700,  'Score floor for "liked" sentiment (display 7.0)'),
    ('ELO_CLAMP_LIKED_MAX',    2000,  'Score ceiling for "liked" sentiment (display 10.0)'),
    ('ELO_CLAMP_OKAY_MIN',     1400,  'Score floor for "okay" sentiment (display 4.0)'),
    ('ELO_CLAMP_OKAY_MAX',     1690,  'Score ceiling for "okay" sentiment (display 6.9)'),
    ('ELO_CLAMP_DISLIKED_MIN', 1100,  'Score floor for "disliked" sentiment (display 1.0)'),
    ('ELO_CLAMP_DISLIKED_MAX', 1390,  'Score ceiling for "disliked" sentiment (display 3.9)');
-- ============================================================
-- LEADERBOARD SNAPSHOTS (Historical ranking records)
-- ============================================================
CREATE TABLE public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    global_dish_score_id UUID NOT NULL REFERENCES public.global_dish_scores(id),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id),
    city_id UUID NOT NULL REFERENCES public.cities(id),
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    rank_position INTEGER NOT NULL,
    bayesian_score NUMERIC NOT NULL,
    raw_weighted_avg NUMERIC,
    total_ratings INTEGER DEFAULT 0,
    confidence_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (snapshot_date, global_dish_score_id)
);
CREATE INDEX idx_leaderboard_snapshots_city_dish_date ON public.leaderboard_snapshots(city_id, dish_type_id, snapshot_date);
CREATE INDEX idx_leaderboard_snapshots_date ON public.leaderboard_snapshots(snapshot_date);
CREATE INDEX idx_leaderboard_snapshots_restaurant ON public.leaderboard_snapshots(restaurant_id, dish_type_id, snapshot_date);
-- ============================================================
-- CITY KNOWN DISHES (admin-curated featured pairings)
-- ============================================================
CREATE TABLE public.city_known_dishes (
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (city_id, dish_type_id)
);
-- ============================================================
-- RESTAURANT DISHES (auto-populated catalog)
-- ============================================================
CREATE TABLE public.restaurant_dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    dish_type_id UUID NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES public.dish_type_variations(id) ON DELETE
    SET NULL,
        is_confirmed BOOLEAN DEFAULT false,
        source TEXT DEFAULT 'rating' CHECK (source IN ('rating', 'manual', 'menu_import')),
        first_rated_at TIMESTAMPTZ,
        total_ratings INTEGER DEFAULT 0,
        photos TEXT [] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
-- Unique index handles nullable variation_id
CREATE UNIQUE INDEX restaurant_dishes_unique_combo ON public.restaurant_dishes (
    restaurant_id,
    dish_type_id,
    COALESCE(
        variation_id,
        '00000000-0000-0000-0000-000000000000'
    )
);
CREATE INDEX idx_restaurant_dishes_restaurant ON public.restaurant_dishes(restaurant_id);
-- ============================================================
-- USER WAITLIST
-- ============================================================
CREATE TABLE public.user_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- ADMIN ACTIONS (audit log)
-- ============================================================
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- CONTENT FLAGS (user reporting)
-- ============================================================
CREATE TABLE public.content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    reporter_id UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_flags_status ON public.content_flags(status);
CREATE INDEX idx_content_flags_target ON public.content_flags(target_type, target_id);
-- ============================================================
-- BLOG TABLES
-- ============================================================
CREATE TABLE public.blog_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    twitter_handle TEXT,
    instagram_handle TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content JSONB,
    featured_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID NOT NULL REFERENCES public.blog_authors(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE RESTRICT,
    city_id UUID REFERENCES public.cities(id) ON DELETE
    SET NULL,
        dish_type_id UUID REFERENCES public.dish_types(id) ON DELETE
    SET NULL,
        seo_title TEXT,
        seo_description TEXT,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_city_dish ON public.blog_posts(city_id, dish_type_id)
WHERE city_id IS NOT NULL
    AND dish_type_id IS NOT NULL;
CREATE TABLE public.blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.blog_post_tags (
    blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    blog_tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_post_id, blog_tag_id)
);