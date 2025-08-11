-- Security Fix Phase 2: Database Hardening and Remaining Issues (Corrected)
-- Fix 1: Secure message_rate_limits table (currently publicly readable)
-- Remove public access and restrict to users viewing their own data only

-- Drop existing public policies on message_rate_limits if any
DROP POLICY IF EXISTS "Public can view message rate limits" ON public.message_rate_limits;

-- Create secure RLS policy for message_rate_limits
CREATE POLICY "Users can view their own rate limits"
ON public.message_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON public.message_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: Secure pricing_settings table (business sensitive data)
-- Restrict access to authorized business administrators only

-- Enable RLS on pricing_settings if not already enabled
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- Drop any public policies
DROP POLICY IF EXISTS "Public can view pricing settings" ON public.pricing_settings;

-- Create secure policies for pricing_settings
CREATE POLICY "Business admins can view pricing settings"
ON public.pricing_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins 
    WHERE user_id = auth.uid() 
    AND admin_level IN ('owner', 'admin')
  )
);

CREATE POLICY "Business owners can manage pricing settings"
ON public.pricing_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins 
    WHERE user_id = auth.uid() 
    AND admin_level = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_admins 
    WHERE user_id = auth.uid() 
    AND admin_level = 'owner'
  )
);

CREATE POLICY "Service role can manage pricing settings"
ON public.pricing_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 3: Update existing functions to use secure search_path
-- This prevents search path manipulation attacks

CREATE OR REPLACE FUNCTION public.check_message_rate_limit(sender_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  daily_limit INTEGER := 500; -- 500 messages per day
  minute_limit INTEGER := 10; -- 10 messages per minute
  current_count INTEGER;
  last_minute_count INTEGER;
  is_limited BOOLEAN := false;
BEGIN
  -- Insert or update rate limit record
  INSERT INTO public.message_rate_limits (user_id, messages_sent_today, last_message_date, last_message_time)
  VALUES (sender_uuid, 1, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    messages_sent_today = CASE 
      WHEN public.message_rate_limits.last_message_date < CURRENT_DATE THEN 1
      ELSE public.message_rate_limits.messages_sent_today + 1
    END,
    last_message_date = CURRENT_DATE,
    last_message_time = NOW();

  -- Check daily limit
  SELECT messages_sent_today INTO current_count
  FROM public.message_rate_limits
  WHERE user_id = sender_uuid;

  -- Check minute limit
  SELECT COUNT(*) INTO last_minute_count
  FROM public.messages
  WHERE sender_id = sender_uuid 
  AND created_at > NOW() - INTERVAL '1 minute';

  -- Apply rate limiting
  IF current_count > daily_limit OR last_minute_count >= minute_limit THEN
    UPDATE public.message_rate_limits 
    SET is_rate_limited = true,
        rate_limit_expires_at = CASE 
          WHEN last_minute_count >= minute_limit THEN NOW() + INTERVAL '1 minute'
          ELSE NOW() + INTERVAL '1 day'
        END
    WHERE user_id = sender_uuid;
    is_limited := true;
  END IF;

  RETURN NOT is_limited;
END;
$function$;

-- Add audit trigger for pricing_settings access
CREATE OR REPLACE FUNCTION public.audit_pricing_settings_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid;
  admin_level text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get admin level for audit
  SELECT ba.admin_level INTO admin_level
  FROM public.business_admins ba
  WHERE ba.user_id = current_user_id;
  
  -- Audit logging for pricing access
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || '_PRICING_SETTINGS',
    'pricing_setting',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'admin_level', COALESCE(admin_level, 'service_role'),
      'user_id', current_user_id
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for pricing_settings audit (corrected - no SELECT trigger)
DROP TRIGGER IF EXISTS audit_pricing_settings_trigger ON public.pricing_settings;
CREATE TRIGGER audit_pricing_settings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_pricing_settings_access();