-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.charms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text NOT NULL,
    icon_url text,
    icon_svg text,
    unlock_criteria jsonb NOT NULL,
    rarity_tier text NOT NULL CHECK (
        rarity_tier = ANY (
            ARRAY ['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text]
        )
    ),
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT charms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dish_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    description text,
    alternate_names ARRAY DEFAULT '{}'::text [],
    common_dietary_tags ARRAY DEFAULT '{}'::text [],
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by_user_id uuid,
    CONSTRAINT dish_types_pkey PRIMARY KEY (id),
    CONSTRAINT dish_types_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.dishes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    variety text,
    current_price numeric,
    currency text NOT NULL DEFAULT 'USD'::text,
    description text,
    dietary_tags ARRAY DEFAULT '{}'::text [],
    spice_level integer DEFAULT 0 CHECK (
        spice_level >= 0
        AND spice_level <= 5
    ),
    photos ARRAY DEFAULT '{}'::text [],
    is_available boolean NOT NULL DEFAULT true,
    date_added timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    added_by_user_id uuid,
    dish_type_id uuid,
    average_rating numeric CHECK (
        average_rating >= 0::numeric
        AND average_rating <= 10::numeric
    ),
    review_count integer NOT NULL DEFAULT 0,
    CONSTRAINT dishes_pkey PRIMARY KEY (id),
    CONSTRAINT dishes_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
    CONSTRAINT dishes_added_by_user_id_fkey FOREIGN KEY (added_by_user_id) REFERENCES auth.users(id),
    CONSTRAINT dishes_dish_type_id_fkey FOREIGN KEY (dish_type_id) REFERENCES public.dish_types(id)
);
CREATE TABLE public.helpful_votes (
    user_id uuid NOT NULL,
    review_id uuid NOT NULL,
    vote_value integer NOT NULL DEFAULT 1 CHECK (vote_value = ANY (ARRAY ['-1'::integer, 1])),
    voted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT helpful_votes_pkey PRIMARY KEY (user_id, review_id),
    CONSTRAINT helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.photos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    uploaded_by_user_id uuid NOT NULL,
    entity_type text NOT NULL CHECK (
        entity_type = ANY (
            ARRAY ['review'::text, 'dish'::text, 'venue'::text]
        )
    ),
    entity_id uuid NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    storage_path text NOT NULL,
    url text NOT NULL,
    file_size_bytes integer,
    mime_type text,
    width integer,
    height integer,
    moderation_status text NOT NULL DEFAULT 'pending'::text CHECK (
        moderation_status = ANY (
            ARRAY ['pending'::text, 'approved'::text, 'flagged'::text, 'rejected'::text]
        )
    ),
    flagged_reason text,
    ai_detected_dish_type text,
    ai_confidence_score numeric,
    exif_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    display_order integer NOT NULL DEFAULT 0,
    CONSTRAINT photos_pkey PRIMARY KEY (id),
    CONSTRAINT photos_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.price_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dish_id uuid NOT NULL,
    price numeric NOT NULL,
    currency text NOT NULL DEFAULT 'USD'::text,
    recorded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    reported_by_user_id uuid,
    source text NOT NULL CHECK (
        source = ANY (
            ARRAY ['user-reported'::text, 'restaurant-updated'::text, 'admin-verified'::text, 'menu-scrape'::text]
        )
    ),
    notes text,
    is_verified boolean NOT NULL DEFAULT false,
    verified_by_user_id uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT price_history_pkey PRIMARY KEY (id),
    CONSTRAINT price_history_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
    CONSTRAINT price_history_reported_by_user_id_fkey FOREIGN KEY (reported_by_user_id) REFERENCES auth.users(id),
    CONSTRAINT price_history_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text UNIQUE,
    display_name text,
    email text NOT NULL UNIQUE,
    location text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    phone_verified boolean NOT NULL DEFAULT false,
    email_verified boolean NOT NULL DEFAULT false,
    charms jsonb NOT NULL DEFAULT '[]'::jsonb,
    reputation_score integer NOT NULL DEFAULT 0,
    profile_photo_url text,
    bio text,
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    dish_id uuid NOT NULL,
    venue_id uuid NOT NULL,
    rating numeric NOT NULL CHECK (
        rating >= 0::numeric
        AND rating <= 10::numeric
    ),
    review_text text,
    photo_urls ARRAY DEFAULT '{}'::text [],
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    location_latitude numeric,
    location_longitude numeric,
    is_gps_verified boolean NOT NULL DEFAULT false,
    is_photo_verified boolean NOT NULL DEFAULT false,
    needs_human_review boolean NOT NULL DEFAULT false,
    helpful_votes_count integer NOT NULL DEFAULT 0,
    edit_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    moderation_status text NOT NULL DEFAULT 'approved'::text CHECK (
        moderation_status = ANY (
            ARRAY ['pending'::text, 'approved'::text, 'flagged'::text, 'rejected'::text]
        )
    ),
    flagged_reason text,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT reviews_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
    CONSTRAINT reviews_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.spatial_ref_sys (
    srid integer NOT NULL CHECK (
        srid > 0
        AND srid <= 998999
    ),
    auth_name character varying,
    auth_srid integer,
    srtext character varying,
    proj4text character varying,
    CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.user_charms (
    user_id uuid NOT NULL,
    charm_id uuid NOT NULL,
    unlocked_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    progress jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_featured boolean NOT NULL DEFAULT false,
    CONSTRAINT user_charms_pkey PRIMARY KEY (user_id, charm_id),
    CONSTRAINT user_charms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT user_charms_charm_id_fkey FOREIGN KEY (charm_id) REFERENCES public.charms(id)
);
CREATE TABLE public.venues (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address_street text NOT NULL,
    address_city text NOT NULL,
    address_state text NOT NULL,
    address_zip text NOT NULL,
    address_country text NOT NULL DEFAULT 'USA'::text,
    latitude numeric,
    longitude numeric,
    cuisine_types ARRAY NOT NULL DEFAULT '{}'::text [],
    is_chain boolean NOT NULL DEFAULT false,
    parent_chain_id uuid,
    hours_of_operation jsonb NOT NULL DEFAULT '{}'::jsonb,
    price_range integer CHECK (
        price_range >= 1
        AND price_range <= 4
    ),
    photos ARRAY DEFAULT '{}'::text [],
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    added_by_user_id uuid,
    CONSTRAINT venues_pkey PRIMARY KEY (id),
    CONSTRAINT venues_parent_chain_id_fkey FOREIGN KEY (parent_chain_id) REFERENCES public.venues(id),
    CONSTRAINT venues_added_by_user_id_fkey FOREIGN KEY (added_by_user_id) REFERENCES auth.users(id)
);