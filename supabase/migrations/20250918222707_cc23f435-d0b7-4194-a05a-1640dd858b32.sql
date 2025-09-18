-- Create RPC to fetch wishlist items accessible to the current viewer
-- This uses SECURITY DEFINER and enforces privacy via existing helper functions
-- Ensures viewers can access: their own wishlists, public wishlists, or accepted connections' wishlists

CREATE OR REPLACE FUNCTION public.get_accessible_wishlist_items(p_recipient_id uuid)
RETURNS TABLE(
  id uuid,
  wishlist_id uuid,
  title text,
  name text,
  price numeric,
  image_url text,
  description text,
  brand text,
  wishlist_title text,
  is_public boolean
) AS $$
DECLARE
  viewer uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    wi.id,
    wi.wishlist_id,
    wi.title,
    wi.name,
    wi.price,
    wi.image_url,
    wi.description,
    wi.brand,
    w.title as wishlist_title,
    w.is_public
  FROM public.wishlist_items wi
  JOIN public.wishlists w ON w.id = wi.wishlist_id
  WHERE w.user_id = p_recipient_id
    AND (
      w.is_public = true
      OR viewer = p_recipient_id
      OR public.are_users_connected(p_recipient_id, viewer)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';