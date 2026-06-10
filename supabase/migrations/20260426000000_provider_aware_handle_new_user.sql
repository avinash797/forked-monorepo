-- Provider-aware profile creation on signup.
-- One trigger, branches on auth provider to extract the right metadata keys.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_provider TEXT := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
    v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    v_display_name TEXT;
    v_username TEXT;
BEGIN
    IF v_provider = 'google' THEN
        v_display_name := NULLIF(TRIM(COALESCE(
            v_meta->>'full_name',
            v_meta->>'name'
        )), '');
    ELSIF v_provider = 'apple' THEN
        -- Apple only sends name on the first sign-in; client may also patch
        -- display_name post-insert, so leaving null here is acceptable.
        v_display_name := NULLIF(TRIM(COALESCE(
            v_meta->>'full_name',
            v_meta->>'name'
        )), '');
    ELSE
        -- Email/password: client passes display_name in signUp options.data
        v_display_name := NULLIF(TRIM(v_meta->>'display_name'), '');
    END IF;
    v_username := COALESCE(
        NULLIF(v_meta->>'username', ''),
        split_part(NEW.email, '@', 1)
    );
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (NEW.id, v_username, v_display_name)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;
