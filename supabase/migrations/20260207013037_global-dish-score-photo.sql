-- Add photos column to restaurant_dishes table
ALTER TABLE public.restaurant_dishes
ADD COLUMN photos text [] DEFAULT '{}';
COMMENT ON COLUMN public.restaurant_dishes.photos IS 'Array of photo URLs for the dish, extracted from global dish scores';
-- Auto-populate trigger function to also include photo URL
CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.restaurant_dishes (
        restaurant_id,
        dish_type_id,
        variation_id,
        source,
        first_rated_at,
        total_ratings,
        photos
    )
VALUES (
        NEW.restaurant_id,
        NEW.dish_type_id,
        NEW.variation_id,
        'rating',
        NOW(),
        1,
        ARRAY [NEW.photo_url]
    ) ON CONFLICT (
        restaurant_id,
        dish_type_id,
        COALESCE(
            variation_id,
            '00000000-0000-0000-0000-000000000000'
        )
    ) DO
UPDATE
SET total_ratings = restaurant_dishes.total_ratings + 1,
    photos = array_append(restaurant_dishes.photos, NEW.photo_url),
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;