-- Fix the can_view_profile function to properly handle accepted connections
-- The current function is incorrectly denying access to accepted connections

DROP FUNCTION IF EXISTS public.can_view_profile(uuid);

CREATE OR REPLACE FUNCTION public.can_view_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  
  -- IMPORTANT FIX: Always allow viewing for accepted connections
  -- Check if users are connected as friends/accepted connections
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE ((user_id = viewer_id AND connected_user_id = profile_user_id) OR
          (user_id = profile_user_id AND connected_user_id = viewer_id)) AND
          status = 'accepted'
  ) INTO are_connected;
  
  -- If they are connected with accepted status, always allow viewing
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
  ELSIF profile_visibility = 'friends' THEN
    -- Already checked above - if we reach here, they're not connected
    RETURN false;
  ELSE
    -- 'private' or any other value - no access except for connected users
    RETURN false;
  END IF;
END;
$function$;