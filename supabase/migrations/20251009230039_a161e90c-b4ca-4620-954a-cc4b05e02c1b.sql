-- Email bombardment prevention: Update cron schedules and cleanup old email events

-- 1. Update order-recovery-monitor from every 30 minutes to every 6 hours
SELECT cron.unschedule('order-recovery-monitor');
SELECT cron.schedule(
  'order-recovery-monitor',
  '0 */6 * * *',  -- Every 6 hours instead of every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/order-recovery-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- 2. Update process-retry-pending-orders from every 15 minutes to every 2 hours
SELECT cron.unschedule('process-retry-pending-orders');
SELECT cron.schedule(
  'process-retry-pending-orders',
  '0 */2 * * *',  -- Every 2 hours instead of every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/process-retry-pending-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- 3. Clean up old email events (>30 days) for completed orders to reduce noise
DELETE FROM order_email_events
WHERE sent_at < (NOW() - INTERVAL '30 days')
AND order_id IN (
  SELECT id FROM orders 
  WHERE status IN ('completed', 'delivered', 'cancelled')
);