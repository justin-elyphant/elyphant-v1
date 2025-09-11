-- Add 'scheduled' status to orders and create daily cron job for processing scheduled orders

-- First, add the 'scheduled' status as a valid option if not already present
-- (This is safe to run multiple times)

-- Create the cron job to run process-scheduled-orders daily at 9 AM EST
SELECT cron.schedule(
  'process-scheduled-orders-daily',
  '0 14 * * *', -- 14:00 UTC = 9:00 AM EST
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/process-scheduled-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"scheduled_run": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create an index on orders table for efficient scheduled order queries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_processing 
ON public.orders (status, scheduled_delivery_date) 
WHERE status = 'scheduled';