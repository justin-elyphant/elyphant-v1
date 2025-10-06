-- Create cron job to check ZMA funding status twice daily
SELECT cron.schedule(
  'check-zma-funding-twice-daily',
  '0 9,17 * * *', -- 9 AM and 5 PM daily
  $$
  SELECT
    net.http_post(
      url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/check-zma-funding-status',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
      body:='{"scheduledRun": true}'::jsonb
    ) as request_id;
  $$
);

-- Add comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS 'ZMA funding monitor: Checks ZMA balance twice daily and sends alerts when funding is needed for pending orders';