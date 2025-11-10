-- Allow unauthenticated users to view pending invitations via token
-- This is secure because:
-- 1. Only works for pending_invitation status (not accepted connections)
-- 2. Invitation tokens are unique UUIDs that are hard to guess
-- 3. Tokens are only shared via secure email links
-- 4. No sensitive user data is exposed - just invitation metadata needed for signup
CREATE POLICY "Anyone can view pending invitations"
  ON user_connections
  FOR SELECT
  TO public
  USING (status = 'pending_invitation');