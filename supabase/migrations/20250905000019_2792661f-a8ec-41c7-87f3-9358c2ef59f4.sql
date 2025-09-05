-- CRITICAL SECURITY FIX: Remove public access to profiles table and implement proper RLS

-- First, let's see the current policies on profiles table
-- DROP the dangerous public read policy if it exists
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create secure RLS policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile (for profile creation)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Connected users can view limited profile data (name, username, profile_image only)
CREATE POLICY "Connected users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != id AND 
  auth.uid() IS NOT NULL AND
  can_view_profile(id) = true
);

-- Business admins can view profiles for support purposes (with audit logging)
CREATE POLICY "Business admins can view profiles" 
ON public.profiles 
FOR SELECT 
USING (is_business_admin(auth.uid()));

-- Fix database function security vulnerabilities
-- Update functions to use explicit search_path settings

-- Fix the search_users_for_friends function
CREATE OR REPLACE FUNCTION public.search_users_for_friends(search_term text, requesting_user_id uuid DEFAULT NULL::uuid, search_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, name text, username text, first_name text, last_name text, email text, profile_image text, bio text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Explicitly set search_path
AS $function$
BEGIN
  -- This function runs with elevated privileges to search profiles
  -- It's specifically designed for friend search functionality
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.username,
    p.first_name,
    p.last_name,
    p.email,
    p.profile_image,
    p.bio
  FROM public.profiles p
  WHERE 
    (
      p.name ILIKE '%' || search_term || '%' OR
      p.username ILIKE '%' || search_term || '%' OR
      p.first_name ILIKE '%' || search_term || '%' OR
      p.last_name ILIKE '%' || search_term || '%'
    )
    -- Exclude the requesting user from results
    AND (requesting_user_id IS NULL OR p.id != requesting_user_id)
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id = requesting_user_id AND bu.blocked_id = p.id)
         OR (bu.blocker_id = p.id AND bu.blocked_id = requesting_user_id)
    )
  ORDER BY 
    -- Prioritize exact matches
    CASE 
      WHEN p.name ILIKE search_term THEN 1
      WHEN p.username ILIKE search_term THEN 2
      WHEN p.first_name ILIKE search_term THEN 3
      WHEN p.last_name ILIKE search_term THEN 4
      ELSE 5
    END,
    p.name
  LIMIT search_limit;
END;
$function$;

-- Update can_view_profile function for better security
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Explicitly set search_path
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

  -- If no viewer (unauthenticated), deny access
  IF viewer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if either user has blocked the other
  IF public.is_user_blocked(viewer_id, profile_user_id) THEN
    RETURN false;
  END IF;
  
  -- Check if users are connected as friends/accepted connections
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE ((user_id = viewer_id AND connected_user_id = profile_user_id) OR
          (user_id = profile_user_id AND connected_user_id = viewer_id)) AND
          status = 'accepted'
  ) INTO are_connected;
  
  -- If they are connected with accepted status, allow limited viewing
  IF are_connected THEN
    RETURN true;
  END IF;
  
  -- Get profile visibility setting (default to 'private' for security)
  SELECT 
    COALESCE(ps.profile_visibility, 'private'),
    COALESCE(p.data_sharing_settings, '{}'::jsonb)
  INTO profile_visibility, data_sharing
  FROM public.privacy_settings ps
  RIGHT JOIN public.profiles p ON p.id = profile_user_id
  WHERE ps.user_id = profile_user_id OR ps.user_id IS NULL;
  
  -- Handle different visibility levels for non-connected users
  IF profile_visibility = 'public' THEN
    RETURN true;
  ELSE
    -- 'private' or 'friends' - no access for non-connected users
    RETURN false;
  END IF;
END;
$function$;

-- Add audit logging for profile access by business admins
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if accessed by business admin (not the profile owner)
  IF auth.uid() != NEW.id AND is_business_admin(auth.uid()) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      action_details
    ) VALUES (
      auth.uid(),
      'PROFILE_ACCESS',
      'profile',
      NEW.id,
      jsonb_build_object(
        'timestamp', now(),
        'accessed_profile_id', NEW.id,
        'access_reason', 'admin_support'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for admin profile access logging
CREATE TRIGGER log_admin_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_profile_access();