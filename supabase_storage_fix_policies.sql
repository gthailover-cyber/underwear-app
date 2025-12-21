-- Clean up and recreate storage policies for room-images bucket
-- Run this FIRST if you get "policy already exists" error

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public room images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own room images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own room images" ON storage.objects;

-- Recreate policies
CREATE POLICY "Public room images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
