-- Enable pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing broken triggers if they exist
DROP TRIGGER IF EXISTS order_email_trigger ON public.orders;
DROP TRIGGER IF EXISTS profile_welcome_email_trigger ON public.profiles;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.trigger_order_emails();
DROP FUNCTION IF EXISTS public.trigger_welcome_email();

-- Create improved trigger functions that work properly
CREATE OR REPLACE FUNCTION public.trigger_order_emails()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI';
BEGIN
  -- Order confirmation email on insert
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'eventType', 'order_created',
        'orderId', NEW.id
      )
    );
    RETURN NEW;
  END IF;
  
  -- Payment confirmation and status update emails on update
  IF TG_OP = 'UPDATE' THEN
    -- Payment confirmation email when payment status changes to succeeded
    IF OLD.payment_status IS DISTINCT FROM 'succeeded' AND NEW.payment_status = 'succeeded' THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'eventType', 'payment_confirmed',
          'orderId', NEW.id
        )
      );
    END IF;
    
    -- Order status update email when status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'eventType', 'order_status_changed',
          'orderId', NEW.id,
          'customData', jsonb_build_object('status', NEW.status)
        )
      );
    END IF;
    
    -- Order cancellation email when status changes to cancelled
    IF OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled' THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'eventType', 'order_cancelled',
          'orderId', NEW.id
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create welcome email trigger function
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI';
BEGIN
  -- Send welcome email for new profiles with email
  IF TG_OP = 'INSERT' AND NEW.email IS NOT NULL THEN
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'eventType', 'user_welcomed',
        'userId', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recreate triggers
CREATE TRIGGER order_email_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_emails();

CREATE TRIGGER profile_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();