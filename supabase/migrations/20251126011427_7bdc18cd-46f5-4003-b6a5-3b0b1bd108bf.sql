-- Fix pending_invitation connections that already have connected_user_id populated
-- These were partially fixed by previous logic but status wasn't updated

UPDATE user_connections
SET 
  status = 'pending',
  updated_at = NOW()
WHERE status = 'pending_invitation'
  AND connected_user_id IS NOT NULL;