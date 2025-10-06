-- Create cron job to process email queue every 10 minutes
-- This ensures all queued emails are sent automatically

SELECT cron.schedule(
  'process-email-queue-every-10-minutes',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/process-email-queue',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
      body:='{"scheduledRun": true}'::jsonb
    ) as request_id;
  $$
);

-- Add comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS 'Email queue processor: Runs every 10 minutes to send queued emails including welcome emails and order notifications';