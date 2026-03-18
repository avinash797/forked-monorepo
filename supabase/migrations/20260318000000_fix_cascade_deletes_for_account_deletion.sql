-- Fix ON DELETE CASCADE constraints that destroy anonymized data
-- when auth.users row is deleted during account deletion.
--
-- Problem: The delete-account edge function anonymizes profile/ratings
-- for leaderboard integrity, then deletes auth.users — but CASCADE FKs
-- wipe out all the anonymized data immediately after.
--
-- Solution: Remove direct FK references from public tables to auth.users.
-- Instead, reference public.profiles (which survives deletion).
-- The profile row is kept as an anonymized tombstone.

BEGIN;

-- ============================================================
-- 1. PROFILES: drop CASCADE FK to auth.users entirely
--    Profile row must survive as an anonymized tombstone.
--    Referential integrity for new users is maintained by the
--    handle_new_user trigger, not by a FK constraint.
-- ============================================================
ALTER TABLE public.profiles
    DROP CONSTRAINT profiles_id_fkey;

-- ============================================================
-- 2. PERSONAL_RATINGS: point FK to profiles instead of auth.users
--    Ratings must survive for leaderboard integrity.
-- ============================================================
ALTER TABLE public.personal_ratings
    DROP CONSTRAINT personal_ratings_user_id_fkey;

ALTER TABLE public.personal_ratings
    ADD CONSTRAINT personal_ratings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 3. COMPARISONS: drop auth.users FK (already has profiles FK)
--    Comparison history must survive for Elo audit trail.
-- ============================================================
ALTER TABLE public.comparisons
    DROP CONSTRAINT comparisons_user_id_fkey;

ALTER TABLE public.comparisons
    ADD CONSTRAINT comparisons_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 4. BATTLE_SESSIONS: point FK to profiles
--    Transient data, but no reason to cascade from auth.users.
-- ============================================================
ALTER TABLE public.battle_sessions
    DROP CONSTRAINT battle_sessions_user_id_fkey;

ALTER TABLE public.battle_sessions
    ADD CONSTRAINT battle_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 5. CONTENT_REPORTS: make reporter_id nullable, SET NULL on delete
--    Reports should survive even if reporter deletes their account.
-- ============================================================
ALTER TABLE public.content_reports
    DROP CONSTRAINT content_reports_reporter_id_fkey;

ALTER TABLE public.content_reports
    ALTER COLUMN reporter_id DROP NOT NULL;

ALTER TABLE public.content_reports
    ADD CONSTRAINT content_reports_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Replace the unique index to exclude NULL reporter_id rows.
-- Without this, the duplicate-report check in report_content() breaks
-- because NULL != NULL in unique indexes.
DROP INDEX IF EXISTS idx_content_reports_unique_report;
CREATE UNIQUE INDEX idx_content_reports_unique_report
    ON public.content_reports(reporter_id, reported_rating_id)
    WHERE reporter_id IS NOT NULL;

-- ============================================================
-- 6. ADMIN_ACTIONS: make admin_id nullable, SET NULL on delete
--    Action audit log should survive admin account deletion.
--    Default FK behavior is RESTRICT which blocks auth deletion.
-- ============================================================
ALTER TABLE public.admin_actions
    DROP CONSTRAINT admin_actions_admin_id_fkey;

ALTER TABLE public.admin_actions
    ALTER COLUMN admin_id DROP NOT NULL;

ALTER TABLE public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 7. CONTENT_FLAGS: re-point reporter_id and reviewed_by to profiles
--    Default FK behavior is RESTRICT which blocks auth deletion.
-- ============================================================
ALTER TABLE public.content_flags
    DROP CONSTRAINT content_flags_reporter_id_fkey;

ALTER TABLE public.content_flags
    ADD CONSTRAINT content_flags_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.content_flags
    DROP CONSTRAINT content_flags_reviewed_by_fkey;

ALTER TABLE public.content_flags
    ADD CONSTRAINT content_flags_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 8. Update anonymize_user_data to clean up photos and battles
-- ============================================================
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_ratings_count INTEGER;
    v_comparisons_count INTEGER;
    v_photo_paths TEXT[];
    v_avatar_path TEXT;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID required';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Can only anonymize your own data';
    END IF;

    -- Count for response
    SELECT COUNT(*) INTO v_ratings_count
    FROM public.personal_ratings
    WHERE user_id = v_user_id;

    SELECT COUNT(*) INTO v_comparisons_count
    FROM public.comparisons
    WHERE user_id = v_user_id;

    -- Collect storage paths before clearing them
    SELECT ARRAY_AGG(photo_storage_path)
    INTO v_photo_paths
    FROM public.personal_ratings
    WHERE user_id = v_user_id
      AND photo_storage_path IS NOT NULL;

    SELECT avatar_url INTO v_avatar_path
    FROM public.profiles
    WHERE id = v_user_id;

    -- Anonymize profile (keep the row as a tombstone)
    UPDATE public.profiles
    SET username = 'deleted_' || SUBSTRING(id::TEXT, 1, 8),
        display_name = 'Deleted User',
        avatar_url = NULL,
        bio = NULL,
        expo_push_token = NULL,
        push_enabled = FALSE,
        updated_at = now()
    WHERE id = v_user_id;

    -- Clear personal data from ratings (keep scores for leaderboard)
    UPDATE public.personal_ratings
    SET notes = NULL,
        photo_url = NULL,
        photo_storage_path = NULL,
        exif_location = NULL,
        exif_timestamp = NULL,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Clean up transient battle sessions
    DELETE FROM public.battle_sessions
    WHERE user_id = v_user_id;

    -- Return photo paths so the edge function can delete storage objects
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'ratings_anonymized', v_ratings_count,
        'comparisons_preserved', v_comparisons_count,
        'photo_storage_paths', COALESCE(to_jsonb(v_photo_paths), '[]'::jsonb),
        'avatar_path', v_avatar_path,
        'note', 'Ratings preserved for leaderboard integrity. Personal data removed.'
    );
END;
$$;

COMMIT;
