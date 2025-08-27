-- Add processing timeout recovery for automated gift executions
-- This migration adds constraints and indexes to help detect and recover stuck executions

-- Add index for efficient stuck execution queries
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_stuck_processing 
ON automated_gift_executions (status, updated_at) 
WHERE status = 'processing';

-- Add index for retry management
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_retry 
ON automated_gift_executions (retry_count, next_retry_at, status);

-- Add constraint to prevent excessive retries
ALTER TABLE automated_gift_executions 
ADD CONSTRAINT chk_retry_count_limit 
CHECK (retry_count <= 5);

-- Update any existing stuck executions (processing for more than 1 hour)
UPDATE automated_gift_executions 
SET 
  status = 'failed',
  error_message = 'Processing stuck - marked as failed during system recovery',
  updated_at = now()
WHERE 
  status = 'processing' 
  AND updated_at < (now() - interval '1 hour')
  AND retry_count >= 3;

-- Reset executions that can still be retried
UPDATE automated_gift_executions 
SET 
  status = 'pending',
  retry_count = COALESCE(retry_count, 0) + 1,
  error_message = 'Recovered from stuck processing state',
  updated_at = now()
WHERE 
  status = 'processing' 
  AND updated_at < (now() - interval '30 minutes')
  AND COALESCE(retry_count, 0) < 3;