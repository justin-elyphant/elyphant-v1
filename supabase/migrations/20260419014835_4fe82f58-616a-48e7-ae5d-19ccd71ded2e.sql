-- Allow anonymous invite link visitors to resolve an inviter's basic profile
-- (name, username, avatar, bio) without requiring the inviter to have a public wishlist.
-- This is required for /invite/:username to render for new (logged-out) users.

CREATE OR REPLACE FUNCTION public.get_invite_profile(_identifier text)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  profile_image text,
  bio text,
  wishlist_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.username,
    p.profile_image,
    p.bio,
    COALESCE((
      SELECT COUNT(*) FROM public.wishlists w
      WHERE w.user_id = p.id AND w.is_public = true
    ), 0) AS wishlist_count
  FROM public.profiles p
  WHERE p.username = _identifier
     OR p.id::text = _identifier
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_profile(text) TO anon, authenticated;