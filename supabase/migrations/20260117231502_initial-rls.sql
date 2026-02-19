-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rating_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_dish_scores ENABLE ROW LEVEL SECURITY;
-- ============================================
-- PUBLIC READ POLICIES (Anyone can read)
-- ============================================
-- Cities
CREATE POLICY "Cities are publicly readable" ON public.cities FOR
SELECT TO authenticated,
    anon USING (true);
-- Neighborhoods
CREATE POLICY "Neighborhoods are publicly readable" ON public.neighborhoods FOR
SELECT TO authenticated,
    anon USING (true);
-- Dish Types
CREATE POLICY "Dish types are publicly readable" ON public.dish_types FOR
SELECT TO authenticated,
    anon USING (true);
-- Taste Tags
CREATE POLICY "Taste tags are publicly readable" ON public.taste_tags FOR
SELECT TO authenticated,
    anon USING (true);
-- Restaurants
CREATE POLICY "Restaurants are publicly readable" ON public.restaurants FOR
SELECT TO authenticated,
    anon USING (true);
-- Global Dish Scores (Leaderboard)
CREATE POLICY "Leaderboard is publicly readable" ON public.global_dish_scores FOR
SELECT TO authenticated,
    anon USING (true);
-- Personal Ratings (Public for discovery)
CREATE POLICY "Ratings are publicly readable" ON public.personal_ratings FOR
SELECT TO authenticated,
    anon USING (true);
-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Anyone can read profiles
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR
SELECT TO authenticated,
    anon USING (true);
-- Users can insert their own profile
CREATE POLICY "Users can create their own profile" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- ============================================
-- PERSONAL RATINGS POLICIES
-- ============================================
-- Users can create their own ratings
CREATE POLICY "Users can create ratings" ON public.personal_ratings FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON public.personal_ratings FOR
UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON public.personal_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- ============================================
-- PERSONAL RATING TAGS POLICIES
-- ============================================
-- Anyone can read rating tags
CREATE POLICY "Rating tags are publicly readable" ON public.personal_rating_tags FOR
SELECT TO authenticated,
    anon USING (true);
-- Users can manage tags on their own ratings
CREATE POLICY "Users can add tags to their ratings" ON public.personal_rating_tags FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM personal_ratings
            WHERE id = rating_id
                AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can remove tags from their ratings" ON public.personal_rating_tags FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM personal_ratings
        WHERE id = rating_id
            AND user_id = auth.uid()
    )
);
-- ============================================
-- COMPARISONS POLICIES
-- ============================================
-- Users can only read their own comparisons
CREATE POLICY "Users can read their own comparisons" ON public.comparisons FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- Users can create their own comparisons
CREATE POLICY "Users can create comparisons" ON public.comparisons FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- ============================================
-- RESTAURANTS POLICIES (Allow authenticated users to insert)
-- ============================================
-- Authenticated users can add new restaurants
CREATE POLICY "Authenticated users can add restaurants" ON public.restaurants FOR
INSERT TO authenticated WITH CHECK (true);