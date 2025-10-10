-- Enable pg_cron extension for scheduling (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule abandoned cart detection to run every hour
-- This will check for carts abandoned >1 hour ago and send recovery emails
SELECT cron.schedule(
  'detect-abandoned-carts-hourly',
  '0 * * * *', -- Run at the start of every hour
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/detect-abandoned-carts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
