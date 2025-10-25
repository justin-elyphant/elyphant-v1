-- Phase 2.1: Make pending_shipping_address nullable and add invitation tracking fields
ALTER TABLE user_connections 
ALTER COLUMN pending_shipping_address DROP NOT NULL;

-- Add tracking fields for invitation follow-up
ALTER TABLE user_connections
ADD COLUMN IF NOT EXISTS invitation_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

-- Add index for reminder queries
CREATE INDEX IF NOT EXISTS idx_user_connections_invitation_reminders 
ON user_connections(status, invitation_sent_at, invitation_reminder_count) 
WHERE status = 'pending_invitation';