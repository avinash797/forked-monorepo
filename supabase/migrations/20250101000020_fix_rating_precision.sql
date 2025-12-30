-- Fix rating column precision to support 0-10 scale
-- Change from NUMERIC(3,2) to NUMERIC(4,2) to allow ratings up to 10.00

-- Step 1: Drop triggers that depend on the rating column
DROP TRIGGER IF EXISTS on_review_inserted_update_dish_rating ON public.reviews;
DROP TRIGGER IF EXISTS on_review_updated_update_dish_rating ON public.reviews;
DROP TRIGGER IF EXISTS on_review_deleted_update_dish_rating ON public.reviews;

-- Step 2: Update reviews.rating column to support 0-10 range
ALTER TABLE public.reviews
  ALTER COLUMN rating TYPE NUMERIC(4,2);

-- Step 3: Update dishes.average_rating column to support 0-10 range
ALTER TABLE public.dishes
  ALTER COLUMN average_rating TYPE NUMERIC(4,2);

-- Update the CHECK constraint on reviews.rating to enforce 0-10 range
-- First drop the existing constraint if it exists
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- Add the updated constraint for 0-10 range
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check
  CHECK (rating >= 0 AND rating <= 10);

-- Add a CHECK constraint on dishes.average_rating to enforce 0-10 range
ALTER TABLE public.dishes
  DROP CONSTRAINT IF EXISTS dishes_average_rating_check;

ALTER TABLE public.dishes
  ADD CONSTRAINT dishes_average_rating_check
  CHECK (average_rating >= 0 AND average_rating <= 10);

-- Step 4: Recreate the triggers
CREATE TRIGGER on_review_inserted_update_dish_rating
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_dish_ratings();

CREATE TRIGGER on_review_updated_update_dish_rating
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  WHEN (old.rating != new.rating OR old.moderation_status != new.moderation_status)
  EXECUTE PROCEDURE public.update_dish_ratings();

CREATE TRIGGER on_review_deleted_update_dish_rating
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_dish_ratings();

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.reviews.rating IS 'Dish rating on 0-10 scale (NUMERIC(4,2) allows values from 0.00 to 10.00)';
COMMENT ON COLUMN public.dishes.average_rating IS 'Average rating on 0-10 scale (NUMERIC(4,2) allows values from 0.00 to 10.00)';
