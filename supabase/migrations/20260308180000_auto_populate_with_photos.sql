-- Backfill photos in restaurant_dishes from existing personal_ratings
UPDATE public.restaurant_dishes rd
SET photos = sub.photos
FROM (
    SELECT
        restaurant_id,
        dish_type_id,
        COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'::uuid) AS variation_key,
        array_agg(photo_url ORDER BY created_at ASC) FILTER (WHERE photo_url IS NOT NULL) AS photos
    FROM public.personal_ratings
    GROUP BY restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'::uuid)
) sub
WHERE rd.restaurant_id = sub.restaurant_id
  AND rd.dish_type_id = sub.dish_type_id
  AND COALESCE(rd.variation_id, '00000000-0000-0000-0000-000000000000'::uuid) = sub.variation_key
  AND sub.photos IS NOT NULL;

-- Update auto_populate_restaurant_dish to track photos from ratings
CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.restaurant_dishes (restaurant_id, dish_type_id, variation_id, source, first_rated_at, total_ratings, photos)
    VALUES (NEW.restaurant_id, NEW.dish_type_id, NEW.variation_id, 'rating', NOW(), 1, ARRAY[NEW.photo_url])
    ON CONFLICT (restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET
        total_ratings = public.restaurant_dishes.total_ratings + 1,
        photos = array_append(public.restaurant_dishes.photos, NEW.photo_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$;
