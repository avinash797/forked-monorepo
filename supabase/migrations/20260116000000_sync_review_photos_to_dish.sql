-- Create a function to sync review photos to the associated dish
-- This trigger will keep the most recent 10 photos of a dish based on review inserts
CREATE OR REPLACE FUNCTION public.sync_review_photos_to_dish() RETURNS TRIGGER AS $$ BEGIN -- Only proceed if the review has photo URLs
    IF NEW.photo_urls IS NOT NULL
    AND array_length(NEW.photo_urls, 1) > 0 THEN
UPDATE public.dishes
SET photos = (
        NEW.photo_urls || COALESCE(photos, ARRAY []::text [])
    ) [1:10],
    updated_at = timezone('utc'::text, now())
WHERE id = NEW.dish_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to execute the function after a review is inserted
DROP TRIGGER IF EXISTS on_review_inserted_sync_photos ON public.reviews;
CREATE TRIGGER on_review_inserted_sync_photos
AFTER
INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.sync_review_photos_to_dish();