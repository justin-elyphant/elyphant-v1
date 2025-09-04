-- =====================================================
-- CRITICAL SECURITY FIXES FOR DATA EXPOSURE ISSUES (Fixed)
-- =====================================================

-- 1. FIX PRIVACY SETTINGS TABLE
-- Remove dangerous policy allowing anonymous access to all privacy settings
DROP POLICY IF EXISTS "Anonymous users can read privacy settings for search" ON public.privacy_settings;

-- Ensure RLS is enabled
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view only their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can manage only their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Business admins can view privacy settings for support" ON public.privacy_settings;

-- Create secure policies for privacy settings
CREATE POLICY "Users can view only their own privacy settings"
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage only their own privacy settings"
ON public.privacy_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Business admins can view privacy settings for support purposes only
CREATE POLICY "Business admins can view privacy settings for support"
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (public.is_business_admin(auth.uid()));

-- 2. FIX ADMIN AUDIT LOG TABLE  
-- Remove overly permissive policy
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.admin_audit_log;

-- Ensure RLS is enabled
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Only business admins can view audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- Create secure admin-only policy
CREATE POLICY "Only business admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_business_admin(auth.uid()));

-- System can still insert audit logs (needed for logging)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- 3. FIX SECURITY EVENTS TABLE
-- Remove overly permissive system policy for SELECT
DROP POLICY IF EXISTS "System can manage ZMA security events" ON public.zma_security_events;

-- Ensure RLS is enabled
ALTER TABLE public.zma_security_events ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own security events" ON public.zma_security_events;
DROP POLICY IF EXISTS "Business admins can view all security events" ON public.zma_security_events;
DROP POLICY IF EXISTS "System can insert security events" ON public.zma_security_events;
DROP POLICY IF EXISTS "System can update security events" ON public.zma_security_events;

-- Users can only see their own security events
CREATE POLICY "Users can view their own security events"
ON public.zma_security_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Business admins can view all security events for monitoring
CREATE POLICY "Business admins can view all security events"
ON public.zma_security_events
FOR SELECT
TO authenticated
USING (public.is_business_admin(auth.uid()));

-- System can insert security events (needed for security logging)
CREATE POLICY "System can insert security events"
ON public.zma_security_events
FOR INSERT
WITH CHECK (true);

-- System can update security events (needed for processing)
CREATE POLICY "System can update security events"
ON public.zma_security_events
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. FIX MESSAGE RATE LIMITS TABLE
-- Remove overly permissive system policy for SELECT
DROP POLICY IF EXISTS "System can manage rate limits" ON public.message_rate_limits;

-- Ensure RLS is enabled
ALTER TABLE public.message_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.message_rate_limits;
DROP POLICY IF EXISTS "Business admins can view all rate limits" ON public.message_rate_limits;
DROP POLICY IF EXISTS "System can insert rate limits" ON public.message_rate_limits;
DROP POLICY IF EXISTS "System can update rate limits" ON public.message_rate_limits;

-- Users can only see their own rate limit data
CREATE POLICY "Users can view their own rate limits"
ON public.message_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Business admins can view rate limits for monitoring
CREATE POLICY "Business admins can view all rate limits"
ON public.message_rate_limits
FOR SELECT
TO authenticated
USING (public.is_business_admin(auth.uid()));

-- System can manage rate limits (needed for rate limiting functionality)
CREATE POLICY "System can insert rate limits"
ON public.message_rate_limits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update rate limits"
ON public.message_rate_limits
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. FIX ZMA ORDER RATE LIMITS TABLE
-- Remove overly permissive system policy for SELECT
DROP POLICY IF EXISTS "System can manage ZMA rate limits" ON public.zma_order_rate_limits;

-- Ensure RLS is enabled
ALTER TABLE public.zma_order_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own ZMA rate limits" ON public.zma_order_rate_limits;
DROP POLICY IF EXISTS "Business admins can view all ZMA rate limits" ON public.zma_order_rate_limits;
DROP POLICY IF EXISTS "System can insert ZMA rate limits" ON public.zma_order_rate_limits;
DROP POLICY IF EXISTS "System can update ZMA rate limits" ON public.zma_order_rate_limits;

-- Users can only see their own rate limit data
CREATE POLICY "Users can view their own ZMA rate limits"
ON public.zma_order_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Business admins can view rate limits for monitoring
CREATE POLICY "Business admins can view all ZMA rate limits"
ON public.zma_order_rate_limits
FOR SELECT
TO authenticated
USING (public.is_business_admin(auth.uid()));

-- System can manage rate limits (needed for rate limiting functionality)
CREATE POLICY "System can insert ZMA rate limits"
ON public.zma_order_rate_limits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update ZMA rate limits"
ON public.zma_order_rate_limits
FOR UPDATE
USING (true)
WITH CHECK (true);