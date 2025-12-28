-- Migration: Create review-photos storage bucket and RLS policies
-- Description: Set up Supabase Storage for user-uploaded review photos
-- Created: 2025-01-01

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;

-- RLS Policy: Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-photos');

-- RLS Policy: Allow public read access to photos
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'review-photos');

-- RLS Policy: Allow users to delete their own photos
-- Photos are organized as: review-photos/{entityType}/{userId}/{timestamp}.{ext}
-- The user ID is in the second position of the path
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- RLS Policy: Allow users to update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Add helpful comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. review-photos bucket stores dish and venue photos.';
