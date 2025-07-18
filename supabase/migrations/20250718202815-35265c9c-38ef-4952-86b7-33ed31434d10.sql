-- Allow anonymous users to view public profiles for search functionality
CREATE POLICY "Anonymous users can view public profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (
  -- Allow viewing profiles that are either:
  -- 1. Have no privacy settings (default to public), OR
  -- 2. Have profile_visibility set to 'public' in privacy_settings
  NOT EXISTS (
    SELECT 1 FROM privacy_settings 
    WHERE privacy_settings.user_id = profiles.id 
    AND privacy_settings.profile_visibility != 'public'
  )
);