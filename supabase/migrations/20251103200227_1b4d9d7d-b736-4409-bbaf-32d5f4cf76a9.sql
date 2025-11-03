
-- ================================================
-- PRIORITY 1: DATABASE SECURITY & PERFORMANCE FIX
-- ================================================

-- 1. Fix function search_path
CREATE OR REPLACE FUNCTION public.is_business_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_admins
    WHERE user_id = check_user_id 
    AND admin_level IN ('owner', 'admin')
  );
END;
$function$;

-- 2. Auth rate limiting table
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  event_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, event_type)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier, event_type);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked ON public.auth_rate_limits(identifier, blocked_until) WHERE blocked_until IS NOT NULL;

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages auth rate limits"
  ON public.auth_rate_limits FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins view auth rate limits"
  ON public.auth_rate_limits FOR SELECT
  USING (is_business_admin(auth.uid()));

-- 3. Rate limit check function
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier text,
  p_event_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record RECORD;
  v_is_blocked boolean := false;
  v_attempts_remaining integer := 0;
  v_reset_at timestamptz;
  v_block_duration interval;
BEGIN
  INSERT INTO public.auth_rate_limits (identifier, event_type)
  VALUES (p_identifier, p_event_type)
  ON CONFLICT (identifier, event_type) DO UPDATE
  SET 
    attempt_count = CASE 
      WHEN auth_rate_limits.first_attempt_at < now() - (p_window_minutes || ' minutes')::interval 
      THEN 1 ELSE auth_rate_limits.attempt_count + 1 END,
    first_attempt_at = CASE 
      WHEN auth_rate_limits.first_attempt_at < now() - (p_window_minutes || ' minutes')::interval 
      THEN now() ELSE auth_rate_limits.first_attempt_at END,
    last_attempt_at = now()
  RETURNING * INTO v_record;

  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
    v_is_blocked := true;
    v_reset_at := v_record.blocked_until;
  ELSIF v_record.attempt_count >= p_max_attempts THEN
    v_block_duration := CASE 
      WHEN v_record.metadata->>'blocks' IS NULL THEN interval '15 minutes'
      WHEN (v_record.metadata->>'blocks')::int = 1 THEN interval '1 hour'
      ELSE interval '24 hours' END;
    
    v_reset_at := now() + v_block_duration;
    
    UPDATE public.auth_rate_limits
    SET blocked_until = v_reset_at,
        metadata = jsonb_set(COALESCE(metadata, '{}'), '{blocks}', 
                   to_jsonb(COALESCE((metadata->>'blocks')::int, 0) + 1))
    WHERE identifier = p_identifier AND event_type = p_event_type;
    
    v_is_blocked := true;
  ELSE
    v_attempts_remaining := p_max_attempts - v_record.attempt_count;
    v_reset_at := v_record.first_attempt_at + (p_window_minutes || ' minutes')::interval;
  END IF;

  RETURN jsonb_build_object(
    'is_blocked', v_is_blocked,
    'attempts_remaining', v_attempts_remaining,
    'reset_at', v_reset_at,
    'current_attempts', v_record.attempt_count
  );
END;
$function$;

-- 4. Reset rate limit
CREATE OR REPLACE FUNCTION public.reset_auth_rate_limit(
  p_identifier text, p_event_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE identifier = p_identifier AND event_type = p_event_type;
END;
$function$;

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_fn ON public.security_audit(user_id, function_name, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_risk ON public.security_logs(user_id, risk_level, created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active, last_activity_at);

-- 6. Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE last_attempt_at < now() - INTERVAL '7 days';
  UPDATE public.auth_rate_limits
  SET blocked_until = NULL
  WHERE blocked_until < now();
END;
$function$;
