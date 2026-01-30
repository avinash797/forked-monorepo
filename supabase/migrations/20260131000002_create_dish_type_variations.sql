-- Migration: Create dish_type_variations table and add variation_id to personal_ratings
-- Variations are specific sub-types of a dish (e.g., Pepperoni, Margherita for Pizza)

-- Create the variations table
CREATE TABLE public.dish_type_variations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dish_type_id uuid NOT NULL REFERENCES public.dish_types(id),
    name text NOT NULL,
    slug text NOT NULL,
    emoji text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dish_type_variations_pkey PRIMARY KEY (id),
    CONSTRAINT dish_type_variations_dish_type_slug_unique UNIQUE (dish_type_id, slug)
);

COMMENT ON TABLE public.dish_type_variations
  IS 'Variations of dish types (e.g., Pepperoni/Margherita for Pizza, Shrimp/Roastbeef for Po-Boy)';

-- Enable RLS
ALTER TABLE public.dish_type_variations ENABLE ROW LEVEL SECURITY;

-- Public read access (same pattern as dish_types)
CREATE POLICY "Dish type variations are publicly readable"
  ON public.dish_type_variations
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Add optional variation_id to personal_ratings
ALTER TABLE public.personal_ratings
  ADD COLUMN variation_id uuid REFERENCES public.dish_type_variations(id);
