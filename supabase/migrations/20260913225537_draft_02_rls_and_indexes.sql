-- =============================================================================
-- DRAFT 2 of 4: is_admin() helper + RLS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ============================================================
-- ENABLE RLS ON EVERY TABLE
-- ============================================================
ALTER TABLE public.cities                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_type_variations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_ratings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rating_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_constants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_dish_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_known_dishes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_dishes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_waitlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CITIES
-- ============================================================
CREATE POLICY "Cities are publicly readable" ON public.cities
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can insert inactive cities" ON public.cities
    FOR INSERT TO authenticated WITH CHECK (is_active = false);
-- FIX: USING added so this ALL policy actually gates DELETE / UPDATE / SELECT.
CREATE POLICY "Admins can manage cities" ON public.cities
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- NEIGHBORHOODS
-- ============================================================
CREATE POLICY "Neighborhoods are publicly readable" ON public.neighborhoods
    FOR SELECT TO authenticated, anon USING (true);

-- ============================================================
-- DISH TYPES
-- ============================================================
CREATE POLICY "Dish types are publicly readable" ON public.dish_types
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage dish types" ON public.dish_types
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- TASTE TAGS
-- ============================================================
CREATE POLICY "Taste tags are publicly readable" ON public.taste_tags
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage taste tags" ON public.taste_tags
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- DISH TYPE VARIATIONS
-- ============================================================
CREATE POLICY "Dish type variations are publicly readable" ON public.dish_type_variations
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage dish type variations" ON public.dish_type_variations
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- RESTAURANTS (FIX: writes are admin-only)
-- ============================================================
CREATE POLICY "Restaurants are publicly readable" ON public.restaurants
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can insert restaurants" ON public.restaurants
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update restaurants" ON public.restaurants
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Profiles are publicly readable" ON public.profiles
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (
        auth.uid() = id
        AND role       = (SELECT role       FROM public.profiles WHERE id = auth.uid())
        AND is_banned  = (SELECT is_banned  FROM public.profiles WHERE id = auth.uid())
        AND banned_at  IS NOT DISTINCT FROM (SELECT banned_at  FROM public.profiles WHERE id = auth.uid())
        AND ban_reason IS NOT DISTINCT FROM (SELECT ban_reason FROM public.profiles WHERE id = auth.uid())
        AND warn_count = (SELECT warn_count FROM public.profiles WHERE id = auth.uid())
    );
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PERSONAL RATINGS
-- ============================================================
CREATE POLICY "Ratings are publicly readable" ON public.personal_ratings
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Hide ratings from blocked users" ON public.personal_ratings
    AS RESTRICTIVE FOR SELECT TO authenticated USING (
        NOT EXISTS (
            SELECT 1 FROM public.blocked_users
            WHERE blocker_id = auth.uid()
              AND blocked_user_id = personal_ratings.user_id
        )
    );
CREATE POLICY "Users can create ratings" ON public.personal_ratings
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.personal_ratings
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.personal_ratings
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PERSONAL RATING TAGS
-- ============================================================
CREATE POLICY "Rating tags are publicly readable" ON public.personal_rating_tags
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can add tags to their ratings" ON public.personal_rating_tags
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.personal_ratings
                WHERE id = rating_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can remove tags from their ratings" ON public.personal_rating_tags
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.personal_ratings
                WHERE id = rating_id AND user_id = auth.uid())
    );

-- ============================================================
-- COMPARISONS
-- ============================================================
CREATE POLICY "Users can read their own comparisons" ON public.comparisons
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Decided comparisons are publicly readable" ON public.comparisons
    FOR SELECT TO authenticated USING (result IN ('new_wins', 'opponent_wins'));
CREATE POLICY "Users can create comparisons" ON public.comparisons
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BATTLE SESSIONS
-- ============================================================
CREATE POLICY "Users can read their own battle sessions" ON public.battle_sessions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create battle sessions" ON public.battle_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own battle sessions" ON public.battle_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- APP CONSTANTS
-- ============================================================
CREATE POLICY "App constants are publicly readable" ON public.app_constants
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage app constants" ON public.app_constants
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- GLOBAL DISH SCORES / LEADERBOARD SNAPSHOTS
-- ============================================================
CREATE POLICY "Leaderboard is publicly readable" ON public.global_dish_scores
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Leaderboard snapshots are publicly readable" ON public.leaderboard_snapshots
    FOR SELECT TO authenticated, anon USING (true);

-- ============================================================
-- CITY KNOWN DISHES
-- ============================================================
CREATE POLICY "City known dishes are publicly readable" ON public.city_known_dishes
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage city known dishes" ON public.city_known_dishes
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- RESTAURANT DISHES (FIX: admin-only writes)
-- ============================================================
CREATE POLICY "Restaurant dishes are publicly readable" ON public.restaurant_dishes
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage restaurant dishes" ON public.restaurant_dishes
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- USER WAITLIST (anon signup; admin read)
-- ============================================================
CREATE POLICY "Anyone can join the waitlist" ON public.user_waitlist
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read the waitlist" ON public.user_waitlist
    FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- ADMIN ACTIONS (admin-only audit log)
-- ============================================================
CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can read admin actions" ON public.admin_actions
    FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- CONTENT FLAGS (legacy)
-- ============================================================
CREATE POLICY "Authenticated users can create flags" ON public.content_flags
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can read content flags" ON public.content_flags
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update content flags" ON public.content_flags
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- CONTENT REPORTS (FIX: admin SELECT + UPDATE policies ship here)
-- ============================================================
CREATE POLICY "Users can create reports" ON public.content_reports
    FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can read own reports" ON public.content_reports
    FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Admins can read all reports" ON public.content_reports
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update reports" ON public.content_reports
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- BLOCKED USERS (owner-scoped)
-- ============================================================
CREATE POLICY "Users can read their own blocks" ON public.blocked_users
    FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Users can create blocks" ON public.blocked_users
    FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
    FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- ============================================================
-- BADGES
-- ============================================================
CREATE POLICY "badge_definitions_public_read" ON public.badge_definitions
    FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "badge_definitions_admin_manage" ON public.badge_definitions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "user_badges_own_read" ON public.user_badges
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- BLOG
-- ============================================================
CREATE POLICY "Public read access for blog_authors" ON public.blog_authors
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog authors" ON public.blog_authors
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read access for blog_categories" ON public.blog_categories
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read access for published blog posts" ON public.blog_posts
    FOR SELECT USING (status = 'published' AND published_at <= now());
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read access for blog_tags" ON public.blog_tags
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog tags" ON public.blog_tags
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read access for blog_post_tags" ON public.blog_post_tags
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog post tags" ON public.blog_post_tags
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
