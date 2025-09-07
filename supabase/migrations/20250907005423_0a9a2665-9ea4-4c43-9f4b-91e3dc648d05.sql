-- Create cron job for automated timeout monitoring
-- This will run every 30 minutes to catch stuck orders
SELECT cron.schedule(
  'order-timeout-monitor',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/order-timeout-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Fix the other stuck orders we found
UPDATE orders 
SET 
  status = 'retry_pending',
  next_retry_at = now(),
  updated_at = now()
WHERE id IN ('d7018239-b3e8-4a86-ba87-365934a05cef', '02b6e42a-7e78-411a-b199-134d344334cf') 
  AND status = 'processing';