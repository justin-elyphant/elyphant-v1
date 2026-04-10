
-- ============================================================
-- Storage Bucket RLS Policies
-- ============================================================

-- AVATARS: Public read, owner-scoped write
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- PROFILE-IMAGES: Public read, owner-scoped write
CREATE POLICY "Profile images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- MESSAGE-ATTACHMENTS: Owner-scoped read and write
CREATE POLICY "Users can view their own message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own message attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
