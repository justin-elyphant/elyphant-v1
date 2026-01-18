-- Add RLS policy to allow public read of profile data for public wishlist owners
-- This enables the shared wishlist page to display owner info to guests

-- First check if a similar policy exists and drop it to avoid duplicates
DROP POLICY IF EXISTS "Public read for public wishlist owners" ON public.profiles;

-- Create policy allowing anyone to read basic profile fields
-- for users who have at least one public wishlist
CREATE POLICY "Public read for public wishlist owners"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.user_id = profiles.id
    AND wishlists.is_public = true
  )
);