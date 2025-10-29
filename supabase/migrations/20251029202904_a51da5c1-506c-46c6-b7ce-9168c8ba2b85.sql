-- Fix RPC: remove reference to non-existent p.location column
CREATE OR REPLACE FUNCTION public.get_public_profile_by_identifier(identifier text)
RETURNS TABLE(
  id uuid,
  name text,
  username text,
  profile_image text,
  bio text,
  location text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  viewer_id uuid;
  target_user_id uuid;
BEGIN
  viewer_id := auth.uid();
  
  -- Try to parse identifier as UUID, otherwise treat as username
  IF identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    target_user_id := identifier::uuid;
  ELSE
    -- Look up user by username
    SELECT p.id INTO target_user_id
    FROM public.profiles p
    WHERE p.username = identifier
    LIMIT 1;
  END IF;
  
  -- If user not found, return empty
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if viewer is blocked (only if authenticated)
  IF viewer_id IS NOT NULL AND public.is_user_blocked(viewer_id, target_user_id) THEN
    RETURN;
  END IF;
  
  -- Return profile data only if visibility is public
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.username,
    p.profile_image,
    p.bio,
    NULL::text AS location, -- Was p.location (column does not exist)
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
  WHERE p.id = target_user_id
    AND COALESCE(ps.profile_visibility, 'public') = 'public';
END;
$$;

-- Ensure execute permissions remain for web clients
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_identifier(text) TO anon, authenticated;