-- Fix existing pending_invitation connections for registered users (Curt Davidson and others)
-- This migration corrects the bug where invitations to existing users were stuck in pending_invitation

DO $$ 
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  -- Update pending_invitation connections where the recipient email matches an existing user
  WITH existing_user_invitations AS (
    SELECT 
      uc.id as connection_id,
      uc.user_id,
      uc.pending_recipient_email,
      p.id as existing_user_id,
      p.name as existing_user_name
    FROM user_connections uc
    INNER JOIN profiles p ON LOWER(uc.pending_recipient_email) = LOWER(p.email)
    WHERE uc.status = 'pending_invitation'
      AND uc.connected_user_id IS NULL
  )
  UPDATE user_connections
  SET 
    connected_user_id = eui.existing_user_id,
    status = 'pending',
    updated_at = NOW()
  FROM existing_user_invitations eui
  WHERE user_connections.id = eui.connection_id;

  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % pending_invitation connections for existing users', fixed_count;
END $$;