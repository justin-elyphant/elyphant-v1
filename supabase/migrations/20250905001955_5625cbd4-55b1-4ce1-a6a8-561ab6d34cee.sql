-- CRITICAL SECURITY FIX: Drop conflicting function and implement proper security

-- Drop the conflicting function first
DROP FUNCTION IF EXISTS public.is_authorized_for_payment_methods(text);

-- Create a helper function to check if a user is authorized for payment methods
CREATE OR REPLACE FUNCTION public.is_authorized_for_payment_methods(permission_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  has_permission boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user is a business admin with appropriate permissions
  SELECT 
    CASE 
      WHEN permission_type = 'view' THEN 
        COALESCE(ba.can_view_payment_methods, false) OR COALESCE(ba.can_manage_payment_methods, false)
      WHEN permission_type = 'manage' THEN 
        COALESCE(ba.can_manage_payment_methods, false)
      ELSE false
    END
  INTO has_permission
  FROM public.business_admins ba
  WHERE ba.user_id = current_user_id;
  
  RETURN COALESCE(has_permission, false);
END;
$function$;

-- Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  accessed_table text,
  accessed_id uuid,
  access_type text,
  access_reason text DEFAULT 'general_access'
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if accessed by business admin and not accessing own data
  IF is_business_admin(auth.uid()) AND auth.uid() != accessed_id THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      action_details
    ) VALUES (
      auth.uid(),
      access_type,
      accessed_table,
      accessed_id,
      jsonb_build_object(
        'timestamp', now(),
        'accessed_table', accessed_table,
        'accessed_id', accessed_id,
        'access_reason', access_reason,
        'user_agent', coalesce(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown')
      )
    );
  END IF;
END;
$function$;

-- Enhanced rate limiting for security functions
CREATE OR REPLACE FUNCTION public.enhanced_message_rate_limit(sender_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  daily_limit INTEGER := 200; -- Reduced from 500 for better security
  minute_limit INTEGER := 5;  -- Reduced from 10 for better security
  current_count INTEGER;
  last_minute_count INTEGER;
  is_limited BOOLEAN := false;
  is_suspicious BOOLEAN := false;
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

  -- Check minute limit - use a more secure check
  SELECT COUNT(*) INTO last_minute_count
  FROM public.messages
  WHERE sender_id = sender_uuid 
  AND created_at > NOW() - INTERVAL '1 minute';

  -- Detect suspicious patterns
  IF current_count > (daily_limit * 0.8) OR last_minute_count >= (minute_limit * 0.8) THEN
    is_suspicious := true;
  END IF;

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

  -- Log suspicious activity
  IF is_suspicious THEN
    PERFORM log_sensitive_data_access('message_rate_limits', sender_uuid, 'RATE_LIMIT_WARNING', 'suspicious_messaging_pattern');
  END IF;

  RETURN NOT is_limited;
END;
$function$;

-- Create comprehensive security health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  health_report jsonb;
  total_users integer;
  public_profiles integer;
  missing_rls_tables integer;
  suspicious_activities integer;
BEGIN
  -- Count total users (use service role context)
  SELECT COUNT(*) INTO total_users 
  FROM auth.users;
  
  -- Check for profiles without proper owner-only RLS policies
  SELECT COUNT(*) INTO public_profiles 
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_name = 'profiles'
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies pp 
    WHERE pp.tablename = 'profiles' 
    AND pp.schemaname = 'public'
    AND pp.policyname LIKE '%own%'
  );
  
  -- Count tables without RLS enabled in public schema
  SELECT COUNT(*) INTO missing_rls_tables
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relname = t.table_name
    AND c.relrowsecurity = true
  );
  
  -- Count recent suspicious activities
  SELECT COUNT(*) INTO suspicious_activities
  FROM public.admin_audit_log
  WHERE created_at > (now() - interval '24 hours')
  AND action_details->>'access_reason' LIKE '%SUSPICIOUS%';
  
  -- Build health report
  health_report := jsonb_build_object(
    'timestamp', now(),
    'total_users', total_users,
    'security_issues', jsonb_build_object(
      'tables_without_proper_rls', public_profiles,
      'missing_rls_tables', missing_rls_tables,
      'suspicious_activities_24h', suspicious_activities
    ),
    'status', CASE 
      WHEN public_profiles > 0 OR missing_rls_tables > 0 THEN 'CRITICAL'
      WHEN suspicious_activities > 10 THEN 'WARNING'
      ELSE 'HEALTHY'
    END,
    'recommendations', CASE 
      WHEN public_profiles > 0 THEN 'Profiles table has unsafe public access policies'
      WHEN missing_rls_tables > 0 THEN 'Some tables are missing RLS protection'
      WHEN suspicious_activities > 10 THEN 'High number of suspicious activities detected'
      ELSE 'Security posture is healthy'
    END
  );
  
  RETURN health_report;
END;
$function$;