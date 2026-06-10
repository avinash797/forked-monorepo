-- ============================================================
-- Block user system for App Store compliance (Guideline 1.2)
-- Guideline 1.2 requires filtering, reporting, AND blocking.
-- ============================================================

-- ============================================================
-- 1. BLOCKED USERS TABLE
-- ============================================================
CREATE TABLE public.blocked_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (blocker_id, blocked_user_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_user_id)
);

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked  ON public.blocked_users(blocked_user_id);

-- ============================================================
-- 2. RLS ON BLOCKED_USERS
-- ============================================================
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can see their own blocks (e.g. to show block status in UI)
CREATE POLICY "Users can read their own blocks"
    ON public.blocked_users
    FOR SELECT TO authenticated
    USING (blocker_id = auth.uid());

-- Users can insert their own blocks (RPC enforces additional constraints)
CREATE POLICY "Users can create blocks"
    ON public.blocked_users
    FOR INSERT TO authenticated
    WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (for future unblock feature)
CREATE POLICY "Users can delete their own blocks"
    ON public.blocked_users
    FOR DELETE TO authenticated
    USING (blocker_id = auth.uid());

-- ============================================================
-- 3. RESTRICTIVE POLICY ON personal_ratings
--
--    Uses AS RESTRICTIVE (AND-semantics): this policy must pass
--    in addition to any permissive policy. The existing
--    "Ratings are publicly readable" USING(true) stays untouched.
--
--    Scoped to `authenticated` only — anon users cannot block.
--    The idx_blocked_users_blocker index makes the subquery fast.
-- ============================================================
CREATE POLICY "Hide ratings from blocked users"
    ON public.personal_ratings
    AS RESTRICTIVE
    FOR SELECT TO authenticated
    USING (
        NOT EXISTS (
            SELECT 1 FROM public.blocked_users
            WHERE blocker_id      = auth.uid()
              AND blocked_user_id = personal_ratings.user_id
        )
    );

-- ============================================================
-- 4. block_user RPC
--
--    Accepts a rating_id and resolves the blocked user server-side.
--    The client never sees the blocked user's UUID.
--    Mirrors the structure of report_content() for consistency.
-- ============================================================
CREATE OR REPLACE FUNCTION public.block_user(p_rating_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blocker_id      UUID := auth.uid();
    v_blocked_user_id UUID;
    v_already_blocked BOOLEAN;
BEGIN
    IF v_blocker_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Resolve the author of the rating
    SELECT user_id INTO v_blocked_user_id
    FROM personal_ratings
    WHERE id = p_rating_id;

    IF v_blocked_user_id IS NULL THEN
        RAISE EXCEPTION 'Rating not found';
    END IF;

    IF v_blocked_user_id = v_blocker_id THEN
        RAISE EXCEPTION 'Cannot block yourself';
    END IF;

    -- Idempotent: return success without erroring if already blocked
    SELECT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE blocker_id      = v_blocker_id
          AND blocked_user_id = v_blocked_user_id
    ) INTO v_already_blocked;

    IF v_already_blocked THEN
        RETURN json_build_object('success', true, 'already_blocked', true);
    END IF;

    INSERT INTO blocked_users (blocker_id, blocked_user_id)
    VALUES (v_blocker_id, v_blocked_user_id);

    RETURN json_build_object('success', true, 'already_blocked', false);
END;
$$;
