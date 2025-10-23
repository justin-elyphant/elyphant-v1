-- Add missing columns to email_queue table for trigger compatibility
ALTER TABLE email_queue 
ADD COLUMN IF NOT EXISTS event_type text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add index on event_type for better query performance
CREATE INDEX IF NOT EXISTS idx_email_queue_event_type ON email_queue(event_type);

-- Add index on priority for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, scheduled_for);

-- Add comment to document event_type values
COMMENT ON COLUMN email_queue.event_type IS 'Type of email event: connection_invitation, connection_accepted, connection_welcome, etc.';