-- Create cron job for daily nudge check
SELECT cron.schedule(
  'daily-nudge-check',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/daily-nudge-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);