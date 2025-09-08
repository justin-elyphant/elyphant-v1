-- Set up daily cron job for profile completion checker
-- This will run the profile completion checker every day at 9 AM UTC

SELECT cron.schedule(
  'daily-profile-completion-check',
  '0 9 * * *', -- 9 AM UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/daily-profile-completion-checker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjA1NiwiZXhwIjoyMDU5MzYyMDU2fQ.q8n8UYGRIAuNBOQLo_KbKpqJ6A6-JpwQpKBGJyVTGmE"}'::jsonb,
        body:=concat('{"scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);