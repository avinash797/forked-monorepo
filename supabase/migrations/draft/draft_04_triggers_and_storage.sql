-- =============================================================================
-- DRAFT MIGRATION 4: Triggers and Storage
--
-- Run order: 4 of 4 (after draft_03_functions_and_rpcs.sql)
-- =============================================================================

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update featured photo on rating (orders by derived_score DESC)
CREATE OR REPLACE FUNCTION public.update_featured_photo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    UPDATE public.global_dish_scores gds
    SET featured_photo_url = (
            SELECT pr.photo_url FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC LIMIT 1
        ),
        featured_rating_id = (
            SELECT pr.id FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC LIMIT 1
        )
    WHERE gds.restaurant_id = NEW.restaurant_id AND gds.dish_type_id = NEW.dish_type_id;
    RETURN NEW;
END;
$$;

-- Auto-populate restaurant_dishes catalog from ratings
CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.restaurant_dishes (restaurant_id, dish_type_id, variation_id, source, first_rated_at, total_ratings)
    VALUES (NEW.restaurant_id, NEW.dish_type_id, NEW.variation_id, 'rating', NOW(), 1)
    ON CONFLICT (restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET total_ratings = public.restaurant_dishes.total_ratings + 1, updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger city enrichment via Edge Function on new city insert
CREATE OR REPLACE FUNCTION public.trigger_enrich_city_dish_types()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM net.http_post(
        url     := 'https://bqxhinoabxmpsvzntrlq.supabase.co/functions/v1/enrich-city-dish-types',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body    := jsonb_build_object(
            'city_id',   NEW.id::text,
            'city_name', NEW.name,
            'state',     NEW.state,
            'country',   COALESCE(NEW.country, 'USA')
        )
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger enrich for city %: %', NEW.name, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Profile auto-creation on auth.users INSERT
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_personal_ratings_updated_at
    BEFORE UPDATE ON public.personal_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_global_dish_scores_updated_at
    BEFORE UPDATE ON public.global_dish_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_restaurant_dishes_updated_at
    BEFORE UPDATE ON public.restaurant_dishes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_blog_authors_updated_at
    BEFORE UPDATE ON public.blog_authors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_blog_categories_updated_at
    BEFORE UPDATE ON public.blog_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Featured photo on rating INSERT or UPDATE
CREATE TRIGGER update_featured_photo_on_rating
    AFTER INSERT OR UPDATE ON public.personal_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_featured_photo();

-- Auto-populate restaurant_dishes on rating INSERT
CREATE TRIGGER auto_populate_restaurant_dish_on_rating
    AFTER INSERT ON public.personal_ratings
    FOR EACH ROW EXECUTE FUNCTION public.auto_populate_restaurant_dish();

-- Enrich city dish types via Edge Function on city INSERT
CREATE TRIGGER on_city_created_enrich_dish_types
    AFTER INSERT ON public.cities
    FOR EACH ROW EXECUTE FUNCTION public.trigger_enrich_city_dish_types();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('avatars',     'avatars',     true),
    ('dish-photos', 'dish-photos', true),
    ('share-cards', 'share-cards', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES — Avatars
-- ============================================================
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- STORAGE POLICIES — Dish Photos
-- ============================================================
CREATE POLICY "Dish photos are publicly accessible"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'dish-photos');

CREATE POLICY "Authenticated users can upload dish photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'dish-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own dish photos"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'dish-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- STORAGE POLICIES — Share Cards
-- ============================================================
CREATE POLICY "Share cards are publicly accessible"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'share-cards');

CREATE POLICY "Authenticated users can create share cards"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'share-cards');
