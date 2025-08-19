-- Clean up RLS policies on wishlists table for better security
-- Drop the less secure policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view public wishlists" ON wishlists;

-- Keep only the secure policy that requires authentication
-- This policy already exists but let's ensure it's properly set up
DROP POLICY IF EXISTS "Users can view public wishlists" ON wishlists;

CREATE POLICY "Users can view public wishlists" 
ON wishlists 
FOR SELECT 
USING (is_public = true AND auth.uid() IS NOT NULL);