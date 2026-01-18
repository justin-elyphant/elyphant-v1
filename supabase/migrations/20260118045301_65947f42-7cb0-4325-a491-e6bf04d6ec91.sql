-- Create a security definer function to safely get profile data for public wishlist owners
-- This bypasses the nested RLS check issue

CREATE OR REPLACE FUNCTION public.get_public_wishlist_owner_profile(wishlist_owner_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  first_name text,
  last_name text,
  profile_image text,
  bio text,
  city text,
  state text,
  username text,
  shipping_address jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return profile if the user has at least one public wishlist
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.first_name,
    p.last_name,
    p.profile_image,
    p.bio,
    p.city,
    p.state,
    p.username,
    p.shipping_address
  FROM profiles p
  WHERE p.id = wishlist_owner_id
  AND EXISTS (
    SELECT 1 FROM wishlists w
    WHERE w.user_id = p.id
    AND w.is_public = true
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_wishlist_owner_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_wishlist_owner_profile(uuid) TO authenticated;