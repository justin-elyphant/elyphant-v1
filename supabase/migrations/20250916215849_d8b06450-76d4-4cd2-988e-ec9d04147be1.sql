-- Fix Order Recovery Logs RLS Security Issue
-- Remove the overly permissive policy that allows public access

-- Drop the problematic policy that allows any access with 'true' condition
DROP POLICY IF EXISTS "Service role can manage recovery logs" ON public.order_recovery_logs;

-- Drop any duplicate policies to clean up
DROP POLICY IF EXISTS "Business admins can view recovery logs" ON public.order_recovery_logs;
DROP POLICY IF EXISTS "order_recovery_logs_access" ON public.order_recovery_logs;

-- Ensure we have clean, secure policies
DROP POLICY IF EXISTS "Business admins can access order recovery logs" ON public.order_recovery_logs;
DROP POLICY IF EXISTS "Service role can manage order recovery logs" ON public.order_recovery_logs;

-- Create secure RLS policies for order recovery logs
-- 1. Service role needs full access for automated recovery systems
CREATE POLICY "Service role full access" ON public.order_recovery_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Business admins can view and manage recovery logs
CREATE POLICY "Business admins can manage recovery logs" ON public.order_recovery_logs
  FOR ALL USING (is_business_admin(auth.uid()))
  WITH CHECK (is_business_admin(auth.uid()));

-- 3. Order owners can view their own order recovery logs only
CREATE POLICY "Order owners can view their recovery logs" ON public.order_recovery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_recovery_logs.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- Add audit logging for recovery log access
INSERT INTO public.admin_audit_log (
  admin_user_id,
  action_type,
  target_type,
  target_id,
  action_details
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'security_fix',
  'rls_policy',
  gen_random_uuid(),
  jsonb_build_object(
    'table', 'order_recovery_logs',
    'issue', 'Fixed overly permissive RLS policies',
    'actions', ARRAY['Removed public access policy', 'Added secure order owner access'],
    'timestamp', now()
  )
);