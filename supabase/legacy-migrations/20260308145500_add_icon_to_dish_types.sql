-- Add icon column to dish_types
ALTER TABLE public.dish_types ADD COLUMN icon text;

-- Add icon column to dish_type_variations as well for consistency
ALTER TABLE public.dish_type_variations ADD COLUMN icon text;
