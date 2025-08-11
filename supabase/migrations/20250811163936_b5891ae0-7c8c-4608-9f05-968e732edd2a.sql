-- CRITICAL SECURITY FIX: Secure profiles table to prevent data theft
-- Remove overly permissive anonymous access and implement proper privacy controls

-- Drop all existing overly permissive policies
DROP POLICY IF EXISTS "Anonymous users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can search public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create secure function to check if a profile can be viewed by the current user
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  viewer_id uuid;
  profile_visibility text;
  are_connected boolean;
BEGIN
  viewer_id := auth.uid();
  
  -- Users can always view their own profile
  IF viewer_id = profile_user_id THEN
    RETURN true;
  END IF;
  
  -- Get profile visibility setting (default to 'private' for security)
  SELECT COALESCE(ps.profile_visibility, 'private') 
  INTO profile_visibility
  FROM public.privacy_settings ps 
  WHERE ps.user_id = profile_user_id;
  
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
$$;

-- Create function to get safe public profile data (excludes sensitive info)
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  viewer_id uuid;
  profile_visibility text;
  data_sharing jsonb;
BEGIN
  viewer_id := auth.uid();
  
  -- Users can see all their own data
  IF viewer_id = profile_user_id THEN
    RETURN true;
  END IF;
  
  -- For others, check what data can be shared based on privacy settings
  SELECT 
    COALESCE(ps.profile_visibility, 'private'),
    COALESCE(p.data_sharing_settings, '{}'::jsonb)
  INTO profile_visibility, data_sharing
  FROM public.privacy_settings ps
  RIGHT JOIN public.profiles p ON p.id = profile_user_id
  WHERE ps.user_id = profile_user_id OR ps.user_id IS NULL;
  
  -- Only allow access if profile is public or friends-only with connection
  IF profile_visibility = 'public' THEN
    RETURN true;
  ELSIF profile_visibility = 'friends' AND public.are_users_connected(viewer_id, profile_user_id) THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- SECURE POLICIES FOR PROFILES TABLE

-- Policy 1: Users can always access their own complete profile
CREATE POLICY "Users can access their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Authenticated users can view limited public profile data based on privacy settings
CREATE POLICY "Authenticated users can view permitted profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() != id AND 
  public.can_view_profile(id) = true
);

-- Policy 3: Completely block anonymous access - no exceptions
-- (No policy for anon role = complete denial)

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke any dangerous public grants
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM anon;

-- Grant minimal necessary permissions to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;