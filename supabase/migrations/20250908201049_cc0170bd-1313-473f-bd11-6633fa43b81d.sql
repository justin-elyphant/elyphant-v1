-- Create triggers for automatic email sending on order events
CREATE OR REPLACE FUNCTION public.trigger_order_emails()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
BEGIN
  -- Order confirmation email on insert
  IF TG_OP = 'INSERT' THEN
    -- Queue order confirmation email
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
      body := json_build_object(
        'eventType', 'order_created',
        'orderId', NEW.id::text
      )::jsonb
    );
    RETURN NEW;
  END IF;
  
  -- Payment confirmation and status update emails on update
  IF TG_OP = 'UPDATE' THEN
    -- Payment confirmation email when payment status changes to succeeded
    IF OLD.payment_status != 'succeeded' AND NEW.payment_status = 'succeeded' THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
        body := json_build_object(
          'eventType', 'payment_confirmed',
          'orderId', NEW.id::text
        )::jsonb
      );
    END IF;
    
    -- Order status update email when status changes
    IF OLD.status != NEW.status THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
        body := json_build_object(
          'eventType', 'order_status_changed',
          'orderId', NEW.id::text,
          'customData', json_build_object('status', NEW.status)
        )::jsonb
      );
    END IF;
    
    -- Order cancellation email when status changes to cancelled
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      PERFORM net.http_post(
        url := site_url || '/functions/v1/ecommerce-email-orchestrator',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
        body := json_build_object(
          'eventType', 'order_cancelled',
          'orderId', NEW.id::text
        )::jsonb
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger on orders table
CREATE TRIGGER order_email_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_emails();

-- Create function to trigger welcome email on new profile
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
BEGIN
  -- Send welcome email for new profiles
  IF TG_OP = 'INSERT' AND NEW.email IS NOT NULL THEN
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
      body := json_build_object(
        'eventType', 'user_welcomed',
        'userId', NEW.id::text
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger on profiles table for welcome emails
CREATE TRIGGER profile_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

-- Create function to detect and handle abandoned carts
CREATE OR REPLACE FUNCTION public.detect_abandoned_carts()
RETURNS void AS $$
DECLARE
  cart_record RECORD;
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
BEGIN
  -- Find carts that were initiated but not completed and haven't received recovery emails recently
  FOR cart_record IN
    SELECT * FROM public.cart_sessions
    WHERE checkout_initiated_at IS NOT NULL
      AND completed_at IS NULL
      AND abandoned_at IS NULL
      AND (last_recovery_email_sent IS NULL OR last_recovery_email_sent < now() - interval '24 hours')
      AND checkout_initiated_at < now() - interval '30 minutes'
      AND recovery_emails_sent < 3
  LOOP
    -- Mark as abandoned and trigger recovery email
    UPDATE public.cart_sessions
    SET abandoned_at = now()
    WHERE id = cart_record.id;
    
    -- Send abandoned cart email
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
      body := json_build_object(
        'eventType', 'cart_abandoned',
        'cartSessionId', cart_record.id::text
      )::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to trigger post-purchase followup emails
CREATE OR REPLACE FUNCTION public.trigger_followup_emails()
RETURNS void AS $$
DECLARE
  order_record RECORD;
  site_url TEXT := 'https://dmkxtkvlispxeqfzlczr.supabase.co';
BEGIN
  -- Find orders delivered 7 days ago that haven't received followup emails
  FOR order_record IN
    SELECT * FROM public.orders
    WHERE status = 'delivered'
      AND followup_email_sent = false
      AND updated_at <= now() - interval '7 days'
  LOOP
    -- Send post-purchase followup email
    PERFORM net.http_post(
      url := site_url || '/functions/v1/ecommerce-email-orchestrator',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_ANON_KEY') || '"}'::jsonb,
      body := json_build_object(
        'eventType', 'post_purchase_followup',
        'orderId', order_record.id::text
      )::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';