-- Critical Security Fix: Secure Profiles Table - Remove Public Access to Customer PII
-- This fixes the critical vulnerability where customer personal information 
-- (emails, names, birth years, shipping addresses) was publicly accessible

-- Remove any existing public access policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view permitted profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure, privacy-respecting policies for profiles
-- Policy 1: Users can always access their own complete profile
CREATE POLICY "Users can access their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Other authenticated users can view profiles based on privacy settings
-- This respects user privacy settings and connection status
CREATE POLICY "Authenticated users can view permitted profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() != id AND 
  can_view_profile(id) = true
);

-- Policy 3: Service role maintains full access for system operations
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update the can_view_profile function to ensure it's secure and follows privacy settings
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  viewer_id uuid;
  profile_visibility text;
  are_connected boolean;
  data_sharing jsonb;
BEGIN
  viewer_id := auth.uid();
  
  -- Users can always view their own profile
  IF viewer_id = profile_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if either user has blocked the other
  IF public.is_user_blocked(viewer_id, profile_user_id) THEN
    RETURN false;
  END IF;
  
  -- Get profile visibility setting (default to 'private' for security)
  SELECT 
    COALESCE(ps.profile_visibility, 'private'),
    COALESCE(p.data_sharing_settings, '{}'::jsonb)
  INTO profile_visibility, data_sharing
  FROM public.privacy_settings ps
  RIGHT JOIN public.profiles p ON p.id = profile_user_id
  WHERE ps.user_id = profile_user_id OR ps.user_id IS NULL;
  
  -- Handle different visibility levels
  IF profile_visibility = 'public' THEN
    RETURN true;
  ELSIF profile_visibility = 'friends' THEN
    -- Check if users are connected as friends
    SELECT public.are_users_connected(viewer_id, profile_user_id) INTO are_connected;
    RETURN are_connected;
  ELSE
    -- 'private' or any other value - no access except for self
    RETURN false;
  END IF;
END;
$function$;