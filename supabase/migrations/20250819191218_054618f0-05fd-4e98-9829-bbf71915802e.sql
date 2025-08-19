-- Fix Dua's wishlist visibility and data
UPDATE wishlists 
SET is_public = true, updated_at = now()
WHERE user_id = '54087479-29f1-4f7f-afd0-cbdc31d6fb91' 
AND title = 'Test wishlist_8.13.2025';

-- Add missing RLS policy for public profile viewing
CREATE POLICY "Public profiles are viewable by anyone" 
ON profiles FOR SELECT 
USING (true);

-- Update existing profile RLS policies to allow public viewing for basic profile data
DROP POLICY IF EXISTS "Users can view profiles with proper permissions" ON profiles;

CREATE POLICY "Users can view profiles with proper permissions" 
ON profiles FOR SELECT 
USING (
  -- Users can always view their own profile
  (auth.uid() = id) OR
  -- Anyone can view basic profile info for public profiles or connection purposes
  (id IS NOT NULL)
);

-- Ensure connection counting works for public profile views
-- The existing connection functions should work with this policy update