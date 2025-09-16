-- CRITICAL SECURITY FIXES
-- Implementing immediate actions from security review

-- 1. FIX EMAIL QUEUE ACCESS (CRITICAL)
-- Current policy allows unrestricted access - this exposes customer email data
-- Replace with system-only access

DROP POLICY IF EXISTS "System can manage email queue" ON public.email_queue;

-- Only service role and authenticated edge functions can manage email queue
CREATE POLICY "Service role can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Business admins can view email queue for monitoring (but not modify)
CREATE POLICY "Business admins can view email queue" 
ON public.email_queue 
FOR SELECT 
USING (is_business_admin(auth.uid()));

-- 2. SECURE ORDER RECOVERY LOGS
-- Add RLS policies to restrict access to business administrators only

-- Enable RLS on order_recovery_logs if it exists and isn't already enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'order_recovery_logs') THEN
    ALTER TABLE public.order_recovery_logs ENABLE ROW LEVEL SECURITY;
    
    -- Only business admins can access order recovery logs
    CREATE POLICY "Business admins can access order recovery logs" 
    ON public.order_recovery_logs 
    FOR ALL 
    USING (is_business_admin(auth.uid()))
    WITH CHECK (is_business_admin(auth.uid()));
    
    -- Service role can manage for automated processes
    CREATE POLICY "Service role can manage order recovery logs" 
    ON public.order_recovery_logs 
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 3. FUNCTION SECURITY HARDENING
-- Add missing SET search_path TO 'public' to functions that need it

-- Update functions that are missing proper search path settings
-- This prevents potential SQL injection through search path manipulation

CREATE OR REPLACE FUNCTION public.update_address_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if shipping_address content actually changed (not just a re-save of same data)
  IF OLD.shipping_address IS DISTINCT FROM NEW.shipping_address THEN
    NEW.address_last_updated = now();
    -- Reset verification status when address content changes
    NEW.address_verified = false;
    NEW.address_verification_method = 'pending_verification';
  ELSE
    -- Keep existing values if address didn't actually change
    NEW.address_last_updated = OLD.address_last_updated;
    
    -- IMPORTANT: Only preserve old verification values if we're not explicitly updating them
    -- This allows manual verification updates to work properly
    IF NEW.address_verified = OLD.address_verified AND NEW.address_verification_method = OLD.address_verification_method THEN
      -- No verification fields are being updated, keep existing values
      NEW.address_verified = OLD.address_verified;
      NEW.address_verification_method = OLD.address_verification_method;
    END IF;
    -- If verification fields are being explicitly updated, let them through
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_gift_proposal_votes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_popularity_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update popularity score when new analytics data is added
  INSERT INTO public.popularity_scores (product_id, customer_score, engagement_score)
  VALUES (NEW.product_id, 1, CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END)
  ON CONFLICT (product_id) DO UPDATE SET
    customer_score = public.popularity_scores.customer_score + 1,
    engagement_score = public.popularity_scores.engagement_score + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_analytics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profile_completion_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Mark that profile was updated after email if recent email was sent
  UPDATE public.profile_completion_analytics 
  SET 
    profile_updated_after_email = true,
    updated_at = now()
  WHERE 
    user_id = NEW.id 
    AND last_email_sent_at > (now() - INTERVAL '7 days');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_elyphant_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only add if it's an elyphant.com email
  IF public.is_elyphant_domain(NEW.email) THEN
    INSERT INTO public.business_admins (
      user_id,
      admin_level,
      can_view_payment_methods,
      can_manage_payment_methods,
      created_by
    ) VALUES (
      NEW.id,
      'admin',
      true,
      true,
      NEW.id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_invitation_conversion_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_status TEXT;
BEGIN
  -- Determine new status based on event type
  CASE NEW.event_type
    WHEN 'email_opened' THEN new_status := 'opened';
    WHEN 'email_clicked' THEN new_status := 'clicked';
    WHEN 'signup_completed' THEN new_status := 'signed_up';
    WHEN 'profile_setup_completed' THEN new_status := 'profile_completed';
    WHEN 'auto_gift_activated' THEN new_status := 'auto_gift_active';
    ELSE new_status := NULL;
  END CASE;

  -- Update analytics record if status should be updated
  IF new_status IS NOT NULL THEN
    UPDATE public.gift_invitation_analytics 
    SET 
      conversion_status = new_status,
      updated_at = now(),
      email_opened_at = CASE WHEN NEW.event_type = 'email_opened' THEN NEW.created_at ELSE email_opened_at END,
      email_clicked_at = CASE WHEN NEW.event_type = 'email_clicked' THEN NEW.created_at ELSE email_clicked_at END,
      signup_completed_at = CASE WHEN NEW.event_type = 'signup_completed' THEN NEW.created_at ELSE signup_completed_at END,
      profile_completed_at = CASE WHEN NEW.event_type = 'profile_setup_completed' THEN NEW.created_at ELSE profile_completed_at END,
      auto_gift_activated_at = CASE WHEN NEW.event_type = 'auto_gift_activated' THEN NEW.created_at ELSE auto_gift_activated_at END
    WHERE id = NEW.invitation_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_location_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.location_cache WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending_invitation' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cart_session_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

-- Add security comments to document changes
COMMENT ON POLICY "Service role can manage email queue" ON public.email_queue IS 
'SECURITY: Restricts email queue access to service role only to protect customer email data';

COMMENT ON POLICY "Business admins can view email queue" ON public.email_queue IS 
'SECURITY: Allows business admins read-only access for monitoring purposes';

-- Log security hardening completion
INSERT INTO public.admin_audit_log (
  admin_user_id,
  action_type,
  target_type,
  target_id,
  action_details
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'security_hardening',
  'database',
  '00000000-0000-0000-0000-000000000000'::uuid,
  jsonb_build_object(
    'action', 'implemented_security_fixes',
    'fixes_applied', jsonb_build_array(
      'email_queue_rls_restriction',
      'order_recovery_logs_admin_only',
      'function_search_path_hardening'
    ),
    'severity', 'critical',
    'completed_at', now()
  )
);