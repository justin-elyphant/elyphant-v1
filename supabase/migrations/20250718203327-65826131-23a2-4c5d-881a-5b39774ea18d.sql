-- Allow anonymous users to read privacy settings for search functionality
CREATE POLICY "Anonymous users can read privacy settings for search" 
ON public.privacy_settings 
FOR SELECT 
TO anon, authenticated
USING (true);