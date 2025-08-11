-- Security Fix Phase 2: Database Hardening (Final)
-- Only apply fixes that haven't been applied yet

-- Fix 1: Secure pricing_settings table (business sensitive data)
-- Enable RLS on pricing_settings if not already enabled
ALTER TABLE IF EXISTS public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing public policies safely
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view pricing settings" ON public.pricing_settings;
    DROP POLICY IF EXISTS "Business admins can view pricing settings" ON public.pricing_settings;
    DROP POLICY IF EXISTS "Business owners can manage pricing settings" ON public.pricing_settings;
    DROP POLICY IF EXISTS "Service role can manage pricing settings" ON public.pricing_settings;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, skip
        NULL;
END $$;

-- Create secure policies for pricing_settings (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pricing_settings') THEN
        -- Business admins can view pricing settings
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

        -- Business owners can manage pricing settings
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

        -- Service role can manage pricing settings
        CREATE POLICY "Service role can manage pricing settings"
        ON public.pricing_settings
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Fix 2: Update check_message_rate_limit function to use secure search_path
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