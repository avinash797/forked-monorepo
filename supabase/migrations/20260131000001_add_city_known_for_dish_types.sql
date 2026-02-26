-- Migration: Create city_known_dishes junction table
-- Links cities to dish types they are famous for (e.g., Cheesesteak for Philadelphia)
-- Uses a proper junction table instead of uuid[] array for FK enforcement

CREATE TABLE public.city_known_dishes (
    city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    dish_type_id uuid NOT NULL REFERENCES public.dish_types(id) ON DELETE CASCADE,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (city_id, dish_type_id)
);
COMMENT ON TABLE public.city_known_dishes
  IS 'Junction table linking cities to dish types they are famous for';
-- Index for reverse lookups (e.g., "which cities are known for pizza?")
CREATE INDEX idx_city_known_dishes_dish_type
  ON public.city_known_dishes (dish_type_id);
-- Enable RLS
ALTER TABLE public.city_known_dishes ENABLE ROW LEVEL SECURITY;
-- Public read access
CREATE POLICY "City known dishes are publicly readable"
  ON public.city_known_dishes
  FOR SELECT
  TO authenticated, anon
  USING (true);
