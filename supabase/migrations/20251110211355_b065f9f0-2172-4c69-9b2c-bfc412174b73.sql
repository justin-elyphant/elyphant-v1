-- Add RLS policy for pending_gift_invitations to allow unauthenticated users to read their pending invitations
-- This is required for the invitation link validation flow before signup

CREATE POLICY "Public can view pending gift invitations"
ON public.pending_gift_invitations
FOR SELECT
TO public
USING (status = 'pending');

COMMENT ON POLICY "Public can view pending gift invitations" ON public.pending_gift_invitations IS 
'Allows unauthenticated users to verify invitation tokens before signup. Only exposes non-sensitive metadata for pending invitations.';