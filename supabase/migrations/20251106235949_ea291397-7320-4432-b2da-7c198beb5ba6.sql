-- Update existing pending invitations to set invitation_sent_at
UPDATE user_connections 
SET invitation_sent_at = COALESCE(created_at, NOW())
WHERE status = 'pending_invitation' 
AND invitation_sent_at IS NULL;

-- Set default for invitation_sent_at to NOW() for future records
ALTER TABLE user_connections 
ALTER COLUMN invitation_sent_at SET DEFAULT NOW();