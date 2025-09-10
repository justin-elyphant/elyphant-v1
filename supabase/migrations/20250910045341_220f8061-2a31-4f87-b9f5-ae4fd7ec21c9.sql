-- Trigger ZMA processing for the recovered order #5b2705
-- First, let's manually trigger the process-zma-order for this specific order
SELECT net.http_post(
    url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/process-zma-order',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
    body := '{"orderId": "1b2de6e6-ddff-4c1c-8581-1ee04a5b2705", "isTestMode": false, "debugMode": false}'::jsonb
) as zma_processing_request;

-- Set up automated monitoring cron jobs
-- Schedule order recovery monitor to run every 30 minutes
SELECT cron.schedule(
  'order-recovery-monitor',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/order-recovery-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule payment reconciliation to run daily at 3 AM
SELECT cron.schedule(
  'payment-reconciliation-daily',
  '0 3 * * *', -- daily at 3 AM
  $$
  SELECT
    net.http_post(
        url:='https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/payment-reconciliation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create function to manually trigger order recovery for specific orders
CREATE OR REPLACE FUNCTION public.trigger_order_recovery(order_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recovery_result JSON;
BEGIN
  -- Log the manual recovery attempt
  INSERT INTO public.order_recovery_logs (
    order_id,
    recovery_type,
    recovery_status,
    metadata
  ) VALUES (
    order_uuid,
    'manual_trigger',
    'initiated',
    json_build_object(
      'triggered_at', now(),
      'triggered_by', 'manual_function'
    )
  );

  -- Make HTTP request to recovery monitor with specific order
  SELECT net.http_post(
    url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/order-recovery-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI"}'::jsonb,
    body := json_build_object('orderId', order_uuid, 'manualTrigger', true)::jsonb
  ) INTO recovery_result;

  RETURN json_build_object(
    'success', true,
    'message', 'Recovery triggered for order: ' || order_uuid,
    'recovery_request', recovery_result
  );
END;
$$;