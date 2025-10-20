-- Replace search_users_for_friends to include default user_addresses fallback for city/state
DROP FUNCTION IF EXISTS public.search_users_for_friends(text, uuid, integer);

CREATE OR REPLACE FUNCTION public.search_users_for_friends(
  search_term text, 
  requesting_user_id uuid DEFAULT NULL::uuid, 
  search_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid, 
  name text, 
  username text, 
  first_name text, 
  last_name text, 
  email text, 
  profile_image text, 
  bio text,
  city text,
  state text,
  shipping_address jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.username,
    p.first_name,
    p.last_name,
    p.email,
    p.profile_image,
    p.bio,
    COALESCE(p.city, (ua.address->>'city')) AS city,
    COALESCE(p.state, (ua.address->>'state')) AS state,
    COALESCE(p.shipping_address, ua.address) AS shipping_address
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT address
    FROM public.user_addresses
    WHERE user_id = p.id
      AND is_default = true
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  ) ua ON TRUE
  WHERE 
    (
      p.name ILIKE '%' || search_term || '%' OR
      p.username ILIKE '%' || search_term || '%' OR
      p.first_name ILIKE '%' || search_term || '%' OR
      p.last_name ILIKE '%' || search_term || '%'
    )
    AND (requesting_user_id IS NULL OR p.id != requesting_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id = requesting_user_id AND bu.blocked_id = p.id)
         OR (bu.blocker_id = p.id AND bu.blocked_id = requesting_user_id)
    )
  ORDER BY 
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