-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up cron job to process retry pending orders every 15 minutes
SELECT cron.schedule(
  'process-retry-pending-orders',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/process-retry-pending-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"scheduled_run": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Update Dua's order to retry_pending status with retry timing
UPDATE orders 
SET 
  status = 'retry_pending',
  retry_count = 0,
  next_retry_at = NOW() + INTERVAL '1 hour',
  retry_reason = 'zma_temporarily_overloaded',
  updated_at = NOW()
WHERE zinc_order_id = 'c0fcd8f9e5f37fe8b3eb6a3a636efb50';