-- Allow anonymous and authenticated users to view basic profile info
-- for users who are discoverable (have at least one public wishlist)
-- This is needed for the /invite/:username and /profile/:username pages
CREATE POLICY "Anyone can view discoverable profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists w
    WHERE w.user_id = profiles.id AND w.is_public = true
  )
);