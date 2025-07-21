-- Add policy to allow authenticated users to search other profiles for friend functionality
-- This respects privacy settings but allows search when profiles are public or don't have explicit privacy settings
CREATE POLICY "Authenticated users can search public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Allow if no privacy settings exist (defaults to public)
  NOT EXISTS (
    SELECT 1 FROM privacy_settings 
    WHERE user_id = profiles.id
  )
  OR
  -- Allow if privacy settings exist and profile is set to public
  EXISTS (
    SELECT 1 FROM privacy_settings 
    WHERE user_id = profiles.id 
    AND profile_visibility = 'public'
  )
);