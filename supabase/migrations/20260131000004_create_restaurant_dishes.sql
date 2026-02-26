-- Migration: Create restaurant_dishes table with auto-populate trigger
-- Tracks which dishes (and variations) a restaurant offers
-- Auto-populated when users rate dishes, also supports manual additions

CREATE TABLE public.restaurant_dishes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id),
    dish_type_id uuid NOT NULL REFERENCES public.dish_types(id),
    variation_id uuid REFERENCES public.dish_type_variations(id),
    is_confirmed boolean DEFAULT false,
    source text DEFAULT 'rating' CHECK (source IN ('rating', 'manual', 'menu_import')),
    first_rated_at timestamp with time zone,
    total_ratings integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT restaurant_dishes_pkey PRIMARY KEY (id)
);
-- Unique constraint handling nullable variation_id
CREATE UNIQUE INDEX restaurant_dishes_unique_combo
  ON public.restaurant_dishes (
    restaurant_id,
    dish_type_id,
    COALESCE(variation_id, '00000000-0000-0000-0000-000000000000')
  );
COMMENT ON TABLE public.restaurant_dishes
  IS 'Catalog of dishes offered at each restaurant, auto-populated from ratings';
-- Index for restaurant detail page (all dishes at a restaurant)
CREATE INDEX idx_restaurant_dishes_restaurant
  ON public.restaurant_dishes (restaurant_id);
-- Enable RLS
ALTER TABLE public.restaurant_dishes ENABLE ROW LEVEL SECURITY;
-- Public read access
CREATE POLICY "Restaurant dishes are publicly readable"
  ON public.restaurant_dishes
  FOR SELECT
  TO authenticated, anon
  USING (true);
-- Authenticated users can add dishes manually
CREATE POLICY "Authenticated users can add restaurant dishes"
  ON public.restaurant_dishes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- Reuse existing updated_at trigger function
CREATE TRIGGER update_restaurant_dishes_updated_at
  BEFORE UPDATE ON public.restaurant_dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
-- Auto-populate trigger function
CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.restaurant_dishes (
    restaurant_id, dish_type_id, variation_id, source, first_rated_at, total_ratings
  )
  VALUES (
    NEW.restaurant_id, NEW.dish_type_id, NEW.variation_id, 'rating', NOW(), 1
  )
  ON CONFLICT (restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'))
  DO UPDATE SET
    total_ratings = restaurant_dishes.total_ratings + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fire after a new rating is inserted
CREATE TRIGGER auto_populate_restaurant_dish_on_rating
  AFTER INSERT ON public.personal_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_restaurant_dish();
