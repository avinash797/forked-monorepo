-- Allow authenticated users to insert cities, but only with is_active = false
CREATE POLICY "Users can insert inactive cities" ON public.cities FOR
INSERT TO authenticated WITH CHECK (is_active = false);