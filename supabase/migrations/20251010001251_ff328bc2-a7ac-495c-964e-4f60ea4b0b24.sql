-- Remove old recovery system cron jobs
SELECT cron.unschedule('order-recovery-monitor');
SELECT cron.unschedule('order-timeout-monitor');
SELECT cron.unschedule('process-retry-pending-orders');

-- Add new unified order monitor cron job (runs every 30 minutes)
SELECT cron.schedule(
  'unified-order-monitor',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/unified-order-monitor',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);