-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to process scheduled orders daily at 2 AM
SELECT cron.schedule(
  'process-scheduled-orders-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/scheduled-order-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);