-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.cities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    state text,
    country text DEFAULT 'USA'::text,
    slug text NOT NULL UNIQUE,
    coordinates USER - DEFINED,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.city_known_dishes (
    city_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT city_known_dishes_pkey PRIMARY KEY (city_id, dish_type_id),
    CONSTRAINT city_known_dishes_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
    CONSTRAINT city_known_dishes_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id)
);
CREATE TABLE public.comparisons (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    rating_a_id uuid NOT NULL,
    rating_b_id uuid NOT NULL,
    winner_rating_id uuid,
    skipped boolean DEFAULT false,
    skip_reason text CHECK (
        skip_reason = ANY (
            ARRAY ['not_tried'::text, 'cant_remember'::text, 'other'::text]
        )
    ),
    rating_a_elo_before numeric,
    rating_a_elo_after numeric,
    rating_b_elo_before numeric,
    rating_b_elo_after numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comparisons_pkey PRIMARY KEY (id),
    CONSTRAINT comparisons_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
    CONSTRAINT comparisons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT comparisons_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id),
    CONSTRAINT comparisons_rating_a_id_fkey FOREIGN KEY (rating_a_id) REFERENCES public.personal_ratings(id),
    CONSTRAINT comparisons_rating_b_id_fkey FOREIGN KEY (rating_b_id) REFERENCES public.personal_ratings(id),
    CONSTRAINT comparisons_winner_rating_id_fkey FOREIGN KEY (winner_rating_id) REFERENCES public.personal_ratings(id)
);
CREATE TABLE public.dish_type_variations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dish_type_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    emoji text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dish_type_variations_pkey PRIMARY KEY (id),
    CONSTRAINT dish_type_variations_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id)
);
CREATE TABLE public.dish_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    emoji text,
    is_active boolean DEFAULT false,
    launch_order integer,
    aliases ARRAY DEFAULT '{}'::text [],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dish_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.global_dish_scores (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    city_id uuid NOT NULL,
    neighborhood_id uuid,
    avg_raw_score numeric,
    total_ratings integer DEFAULT 0,
    global_elo numeric DEFAULT 1500.00,
    total_battles integer DEFAULT 0,
    battles_won integer DEFAULT 0,
    win_rate numeric DEFAULT 0.0000,
    confidence_score numeric DEFAULT 0.000,
    featured_photo_url text,
    featured_rating_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT global_dish_scores_pkey PRIMARY KEY (id),
    CONSTRAINT global_dish_scores_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
    CONSTRAINT global_dish_scores_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id),
    CONSTRAINT global_dish_scores_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
    CONSTRAINT global_dish_scores_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id),
    CONSTRAINT global_dish_scores_featured_rating_id_fkey FOREIGN KEY (featured_rating_id) REFERENCES public.personal_ratings(id)
);
CREATE TABLE public.leaderboard_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    global_dish_score_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    city_id uuid NOT NULL,
    neighborhood_id uuid,
    rank_position integer NOT NULL,
    global_elo numeric NOT NULL,
    avg_raw_score numeric,
    total_ratings integer DEFAULT 0,
    total_battles integer DEFAULT 0,
    battles_won integer DEFAULT 0,
    win_rate numeric,
    confidence_score numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT leaderboard_snapshots_pkey PRIMARY KEY (id),
    CONSTRAINT leaderboard_snapshots_global_dish_score_id_fkey FOREIGN KEY (global_dish_score_id) REFERENCES public.global_dish_scores(id),
    CONSTRAINT leaderboard_snapshots_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
    CONSTRAINT leaderboard_snapshots_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id),
    CONSTRAINT leaderboard_snapshots_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
    CONSTRAINT leaderboard_snapshots_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.neighborhoods (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    city_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    boundary USER - DEFINED,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT neighborhoods_pkey PRIMARY KEY (id),
    CONSTRAINT neighborhoods_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id)
);
CREATE TABLE public.personal_rating_tags (
    rating_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_rating_tags_pkey PRIMARY KEY (rating_id, tag_id),
    CONSTRAINT personal_rating_tags_rating_id_fkey FOREIGN KEY (rating_id) REFERENCES public.personal_ratings(id),
    CONSTRAINT personal_rating_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.taste_tags(id)
);
CREATE TABLE public.personal_ratings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    photo_url text NOT NULL,
    photo_storage_path text,
    raw_score numeric NOT NULL CHECK (
        raw_score >= 1::numeric
        AND raw_score <= 10::numeric
    ),
    personal_elo numeric DEFAULT 1500.00,
    battles_won integer DEFAULT 0,
    battles_lost integer DEFAULT 0,
    battles_total integer DEFAULT 0,
    notes text,
    location_verified boolean DEFAULT false,
    exif_location USER - DEFINED,
    exif_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    variation_id uuid,
    CONSTRAINT personal_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT personal_ratings_variation_id_fkey FOREIGN KEY (variation_id) REFERENCES public.dish_type_variations(id),
    CONSTRAINT personal_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT personal_ratings_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
    CONSTRAINT personal_ratings_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id)
);
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text UNIQUE,
    display_name text,
    avatar_url text,
    home_city_id uuid,
    bio text,
    total_ratings integer DEFAULT 0,
    total_battles integer DEFAULT 0,
    credibility_score numeric DEFAULT 1.00,
    expo_push_token text,
    push_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
    CONSTRAINT profiles_home_city_id_fkey FOREIGN KEY (home_city_id) REFERENCES public.cities(id)
);
CREATE TABLE public.restaurant_dishes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL,
    dish_type_id uuid NOT NULL,
    variation_id uuid,
    is_confirmed boolean DEFAULT false,
    source text DEFAULT 'rating'::text CHECK (
        source = ANY (
            ARRAY ['rating'::text, 'manual'::text, 'menu_import'::text]
        )
    ),
    first_rated_at timestamp with time zone,
    total_ratings integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photos ARRAY DEFAULT '{}'::text [],
    CONSTRAINT restaurant_dishes_pkey PRIMARY KEY (id),
    CONSTRAINT restaurant_dishes_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
    CONSTRAINT restaurant_dishes_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id),
    CONSTRAINT restaurant_dishes_variation_id_fkey FOREIGN KEY (variation_id) REFERENCES public.dish_type_variations(id)
);
CREATE TABLE public.restaurants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text,
    city_id uuid,
    neighborhood_id uuid,
    coordinates USER - DEFINED,
    google_place_id text UNIQUE,
    phone text,
    website text,
    is_verified boolean DEFAULT false,
    is_closed boolean DEFAULT false,
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    types ARRAY DEFAULT '{}'::text [],
    CONSTRAINT restaurants_pkey PRIMARY KEY (id),
    CONSTRAINT restaurants_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
    CONSTRAINT restaurants_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.taste_tags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    dish_type_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT taste_tags_pkey PRIMARY KEY (id),
    CONSTRAINT taste_tags_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id)
);