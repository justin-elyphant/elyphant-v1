-- Create a database function to search users that bypasses RLS for friend search functionality
CREATE OR REPLACE FUNCTION public.search_users_for_friends(
  search_term TEXT,
  requesting_user_id UUID DEFAULT NULL,
  search_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  profile_image TEXT,
  bio TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;