-- Critical Security Fix: Remove Public Access to Profiles Table
-- The profiles table currently allows public reading of customer PII including:
-- - Email addresses, names, birth years, shipping addresses
-- This is a critical security vulnerability that must be fixed immediately

-- First, check if there are any anonymous/public policies that need to be removed
-- Remove any existing public access policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure, privacy-respecting policies for profiles
-- Users can always access their own complete profile
CREATE POLICY "Users can access their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Other authenticated users can view profiles based on privacy settings and connections
-- This policy respects the user's privacy settings and data sharing preferences
CREATE POLICY "Authenticated users can view permitted profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() != id AND 
  can_view_profile(id) = true
);

-- Service role maintains full access for system operations
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add enhanced audit logging for profile access
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid;
  target_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  target_user_id := COALESCE(NEW.id, OLD.id);
  
  -- Only log if accessing someone else's profile
  IF current_user_id IS NOT NULL AND current_user_id != target_user_id THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      action_details
    ) VALUES (
      current_user_id,
      'PROFILE_ACCESS_' || TG_OP,
      'profile',
      target_user_id,
      jsonb_build_object(
        'timestamp', now(),
        'operation', TG_OP,
        'accessing_user', current_user_id,
        'target_profile', target_user_id,
        'access_method', 'direct_query'
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create audit trigger for profile access monitoring
DROP TRIGGER IF EXISTS audit_profile_access_trigger ON public.profiles;
CREATE TRIGGER audit_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profile_access();

-- Update the can_view_profile function to ensure it's secure
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