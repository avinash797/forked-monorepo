-- Critical for deduplication and syncing with external data sources
ALTER TABLE public.venues
ADD COLUMN google_place_id TEXT UNIQUE;
-- Geospatial column for efficient "Near Me" queries
ALTER TABLE public.venues
ADD COLUMN location GEOGRAPHY(POINT);
ALTER TABLE public.venues
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
-- Verified by platform admins
-- Indexes for performance
create index venues_google_place_id_idx on public.venues(google_place_id);
-- Add comments for documentation
comment on column public.venues.google_place_id is 'Google Place ID for deduplication and syncing with external data sources';
comment on column public.venues.location is 'Geospatial column for efficient "Near Me" queries';
comment on column public.venues.is_verified is 'Verified by platform admins';
-- Taxonomy
ALTER TABLE public.dishes
ADD COLUMN tags TEXT [];
-- Elo rating
ALTER TABLE public.dishes
ADD COLUMN elo_rating FLOAT DEFAULT 1400.0;
ALTER TABLE public.dishes
ADD COLUMN comparison_count INTEGER DEFAULT 0;
-- AI EMBEDDING
-- Generated from Name + Description + Tags via OpenAI/HuggingFace.
-- Used for "More like this" and "Recommended for you".
ALTER TABLE public.dishes
ADD COLUMN embedding VECTOR(128);