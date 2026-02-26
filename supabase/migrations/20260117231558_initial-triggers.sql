-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, username, display_name, avatar_url)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name'
        ),
        NEW.raw_user_meta_data->>'avatar_url'
    );
RETURN NEW;
END;
$$;
-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================
-- UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
-- Apply to tables with updated_at
CREATE TRIGGER update_cities_updated_at BEFORE
UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_restaurants_updated_at BEFORE
UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_personal_ratings_updated_at BEFORE
UPDATE ON public.personal_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_global_dish_scores_updated_at BEFORE
UPDATE ON public.global_dish_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- ============================================
-- UPDATE FEATURED PHOTO ON RATING
-- ============================================
CREATE OR REPLACE FUNCTION public.update_featured_photo() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Update featured photo to highest-rated photo for this dish/restaurant
UPDATE global_dish_scores gds
SET featured_photo_url = (
        SELECT pr.photo_url
        FROM personal_ratings pr
        WHERE pr.restaurant_id = NEW.restaurant_id
            AND pr.dish_type_id = NEW.dish_type_id
        ORDER BY pr.raw_score DESC,
            pr.created_at DESC
        LIMIT 1
    ), featured_rating_id = (
        SELECT pr.id
        FROM personal_ratings pr
        WHERE pr.restaurant_id = NEW.restaurant_id
            AND pr.dish_type_id = NEW.dish_type_id
        ORDER BY pr.raw_score DESC,
            pr.created_at DESC
        LIMIT 1
    )
WHERE gds.restaurant_id = NEW.restaurant_id
    AND gds.dish_type_id = NEW.dish_type_id;
RETURN NEW;
END;
$$;
CREATE TRIGGER update_featured_photo_on_rating
AFTER
INSERT
    OR
UPDATE ON public.personal_ratings FOR EACH ROW EXECUTE FUNCTION public.update_featured_photo();
