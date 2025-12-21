-- Create Storage Bucket for Room Images
-- Run this in Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for the bucket

-- Policy: Anyone can view public room images
CREATE POLICY "Public room images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Policy: Authenticated users can upload room images
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own room images
CREATE POLICY "Users can update own room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own room images
CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
