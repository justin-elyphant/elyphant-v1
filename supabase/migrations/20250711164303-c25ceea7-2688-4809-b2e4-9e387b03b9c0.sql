-- Temporarily disable all RLS policies on storage.objects to isolate the issue
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;  
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;

-- Create very simple policies that don't use any complex functions
CREATE POLICY "Allow all operations on avatars bucket" ON storage.objects
FOR ALL USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Also make sure the bucket exists and is public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';