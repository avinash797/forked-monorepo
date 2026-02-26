-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
    ('dish-photos', 'dish-photos', true),
    ('share-cards', 'share-cards', true);
-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- Dish Photos bucket
CREATE POLICY "Dish photos are publicly accessible" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'dish-photos');
CREATE POLICY "Authenticated users can upload dish photos" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'dish-photos'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can delete their own dish photos" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'dish-photos'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- Share Cards bucket
CREATE POLICY "Share cards are publicly accessible" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'share-cards');
CREATE POLICY "Authenticated users can create share cards" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'share-cards');
