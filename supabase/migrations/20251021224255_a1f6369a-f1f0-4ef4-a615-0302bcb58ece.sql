
-- First, let's check current policies and create comprehensive RLS policies for user_connections

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can create their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON user_connections;

-- Create comprehensive policies that allow users to see connections where they are either the sender or recipient
CREATE POLICY "Users can view connections where they are involved"
ON user_connections
FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.uid() = connected_user_id
);

CREATE POLICY "Users can create their own connection requests"
ON user_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update connections where they are involved"
ON user_connections
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() = connected_user_id
);

CREATE POLICY "Users can delete their own connection requests"
ON user_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Also ensure profiles table allows users to see profiles of people they have connections with
DROP POLICY IF EXISTS "Users can view connected profiles" ON profiles;

CREATE POLICY "Users can view connected profiles"
ON profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = id
  OR
  -- Users can see profiles of people they have pending/accepted connections with
  EXISTS (
    SELECT 1 FROM user_connections
    WHERE (
      (user_connections.user_id = auth.uid() AND user_connections.connected_user_id = profiles.id)
      OR
      (user_connections.connected_user_id = auth.uid() AND user_connections.user_id = profiles.id)
    )
    AND user_connections.status IN ('pending', 'accepted', 'pending_incoming')
  )
);
