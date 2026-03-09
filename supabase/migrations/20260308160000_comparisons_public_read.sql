-- Allow all authenticated users to read decided comparisons (new_wins / opponent_wins).
-- Previously the SELECT policy restricted reads to auth.uid() = user_id, which caused
-- the RecentBattleTicker to return an empty array for new users and only the current
-- user's own battles for existing users.
CREATE POLICY "Decided comparisons are publicly readable" ON public.comparisons FOR
SELECT TO authenticated USING (result IN ('new_wins', 'opponent_wins'));
