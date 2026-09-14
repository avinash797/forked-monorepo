-- =============================================================================
-- DRAFT 4 of 4: Trigger functions, triggers, storage, and scheduled jobs
-- =============================================================================

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_provider     TEXT  := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
    v_meta         JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    v_display_name TEXT;
    v_username     TEXT;
BEGIN
    IF v_provider = 'google' THEN
        v_display_name := NULLIF(TRIM(COALESCE(v_meta->>'full_name', v_meta->>'name')), '');
    ELSIF v_provider = 'apple' THEN
        v_display_name := NULLIF(TRIM(COALESCE(v_meta->>'full_name', v_meta->>'name')), '');
    ELSE
        v_display_name := NULLIF(TRIM(v_meta->>'display_name'), '');
    END IF;

    v_username := COALESCE(NULLIF(v_meta->>'username', ''), split_part(NEW.email, '@', 1));

    -- FIX: fall back to a guaranteed-unique handle instead of aborting signup.
    BEGIN
        INSERT INTO public.profiles (id, username, display_name)
        VALUES (NEW.id, v_username, v_display_name)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
        INSERT INTO public.profiles (id, username, display_name)
        VALUES (NEW.id, v_username || '_' || replace(NEW.id::text, '-', ''), v_display_name)
        ON CONFLICT (id) DO NOTHING;
    END;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_featured_photo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    UPDATE public.global_dish_scores gds
    SET (featured_photo_url, featured_rating_id) = (
            SELECT pr.photo_url, pr.id FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
              AND pr.photo_url IS NOT NULL
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC LIMIT 1
        )
    WHERE gds.restaurant_id = NEW.restaurant_id
      AND gds.dish_type_id = NEW.dish_type_id
      AND EXISTS (
            SELECT 1 FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
              AND pr.photo_url IS NOT NULL
        );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_populate_restaurant_dish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    INSERT INTO public.restaurant_dishes (
        restaurant_id, dish_type_id, variation_id,
        source, first_rated_at, total_ratings, photos
    )
    VALUES (
        NEW.restaurant_id, NEW.dish_type_id, NEW.variation_id,
        'rating', NOW(), 1,
        CASE WHEN NEW.photo_url IS NOT NULL THEN ARRAY[NEW.photo_url] ELSE ARRAY[]::TEXT[] END
    )
    ON CONFLICT (restaurant_id, dish_type_id, COALESCE(variation_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET
        total_ratings = public.restaurant_dishes.total_ratings + 1,
        photos = CASE
            WHEN NEW.photo_url IS NOT NULL
            THEN array_append(public.restaurant_dishes.photos, NEW.photo_url)
            ELSE public.restaurant_dishes.photos
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enrich_city_dish_types()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
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

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_featured_photo()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_populate_restaurant_dish()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_enrich_city_dish_types() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

CREATE TRIGGER update_featured_photo_on_rating
    AFTER INSERT OR UPDATE ON public.personal_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_featured_photo();
CREATE TRIGGER auto_populate_restaurant_dish_on_rating
    AFTER INSERT ON public.personal_ratings
    FOR EACH ROW EXECUTE FUNCTION public.auto_populate_restaurant_dish();

-- City-enrichment trigger intentionally NOT installed.

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
    ('avatars',           'avatars',           true),
    ('dish-photos',       'dish-photos',       true),
    ('share-cards',       'share-cards',       true),
    ('badges',            'badges',            true),
    ('dish_placeholders', 'dish_placeholders', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- Avatars ----------
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Dish photos ----------
CREATE POLICY "Dish photos are publicly accessible"
    ON storage.objects FOR SELECT TO public USING (bucket_id = 'dish-photos');
CREATE POLICY "Authenticated users can upload dish photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'dish-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own dish photos"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'dish-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Share cards ----------
CREATE POLICY "Share cards are publicly accessible"
    ON storage.objects FOR SELECT TO public USING (bucket_id = 'share-cards');
CREATE POLICY "Authenticated users can create share cards"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'share-cards');

-- ---------- Badges ----------
CREATE POLICY "badges_bucket_public_read"
    ON storage.objects FOR SELECT USING (bucket_id = 'badges');

-- ---------- Dish placeholders ----------
CREATE POLICY "dish_placeholders_bucket_public_read"
    ON storage.objects FOR SELECT USING (bucket_id = 'dish_placeholders');

-- ============================================================
-- SCHEDULED JOBS (pg_cron) — daily leaderboard snapshot at 03:00 UTC
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-leaderboard-snapshot') THEN
        PERFORM cron.unschedule('daily-leaderboard-snapshot');
    END IF;
END;
$$;

SELECT cron.schedule(
    'daily-leaderboard-snapshot',
    '0 3 * * *',
    $$SELECT public.take_leaderboard_snapshot()$$
);

SELECT public.take_leaderboard_snapshot(CURRENT_DATE);
