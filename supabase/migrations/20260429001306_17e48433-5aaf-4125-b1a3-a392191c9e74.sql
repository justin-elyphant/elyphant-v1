-- Fix can_view_profile: remove stale read of profiles.data_sharing_settings
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

  -- Always allow viewing for accepted connections
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE ((user_id = viewer_id AND connected_user_id = profile_user_id) OR
          (user_id = profile_user_id AND connected_user_id = viewer_id)) AND
          status = 'accepted'
  ) INTO are_connected;

  IF are_connected THEN
    RETURN true;
  END IF;

  -- Get profile visibility setting (default to 'private' for security)
  SELECT COALESCE(ps.profile_visibility, 'private')
  INTO profile_visibility
  FROM public.privacy_settings ps
  WHERE ps.user_id = profile_user_id;

  IF profile_visibility = 'public' THEN
    RETURN true;
  ELSIF profile_visibility = 'friends' THEN
    RETURN false;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Fix get_safe_profile_data: same stale column read
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  viewer_id uuid;
  profile_visibility text;
BEGIN
  viewer_id := auth.uid();

  IF viewer_id = profile_user_id THEN
    RETURN true;
  END IF;

  SELECT COALESCE(ps.profile_visibility, 'private')
  INTO profile_visibility
  FROM public.privacy_settings ps
  WHERE ps.user_id = profile_user_id;

  IF profile_visibility = 'public' THEN
    RETURN true;
  ELSIF profile_visibility = 'friends' AND public.are_users_connected(viewer_id, profile_user_id) THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;