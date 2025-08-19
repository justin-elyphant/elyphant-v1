-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles with proper permissions" ON profiles;

-- Create a comprehensive RLS policy for profile viewing
CREATE POLICY "Allow profile access for public viewing" 
ON profiles FOR SELECT 
USING (
  -- Always allow access to basic profile data for authenticated or unauthenticated users
  -- This enables public profile viewing and connection functionality
  true
);

-- Ensure profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;