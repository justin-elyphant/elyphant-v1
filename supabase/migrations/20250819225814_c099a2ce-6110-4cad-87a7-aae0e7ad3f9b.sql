-- Check existing RLS policies on wishlists table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'wishlists';

-- Create RLS policy to allow viewing public wishlists
DROP POLICY IF EXISTS "Anyone can view public wishlists" ON wishlists;

CREATE POLICY "Anyone can view public wishlists" 
ON wishlists 
FOR SELECT 
USING (is_public = true);

-- Ensure authenticated users can view public wishlists
DROP POLICY IF EXISTS "Users can view public wishlists" ON wishlists;

CREATE POLICY "Users can view public wishlists" 
ON wishlists 
FOR SELECT 
USING (is_public = true AND auth.uid() IS NOT NULL);