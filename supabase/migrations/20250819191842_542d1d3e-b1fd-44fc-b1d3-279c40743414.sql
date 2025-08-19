-- Remove the blocking anonymous access policy that's preventing profile viewing
DROP POLICY IF EXISTS "deny_anonymous_access" ON profiles;

-- Update the policy to be more permissive for public profile viewing
DROP POLICY IF EXISTS "Allow profile access for public viewing" ON profiles;

-- Create a proper policy that allows viewing profiles for connection purposes
CREATE POLICY "Allow profile viewing" 
ON profiles FOR SELECT 
USING (
  -- Allow authenticated users to view any profile (for connections)
  auth.role() = 'authenticated' OR 
  -- Allow anonymous users to view profiles (for public viewing)
  auth.role() = 'anon'
);