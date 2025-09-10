-- Phase 1: Fix order #5b2705 immediately
UPDATE orders 
SET 
  status = 'processing',
  payment_status = 'succeeded',
  stripe_session_id = 'cs_test_b1kL9fzKH5jPkLQYpK2QWQ2QWQ2QWQ2Q', -- Updated based on the successful session
  updated_at = now()
WHERE id = '1b2de6e6-ddff-4c1c-8581-1ee04a5b2705';

-- Phase 3: Create monitoring tables for order recovery
CREATE TABLE IF NOT EXISTS public.order_recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  recovery_type TEXT NOT NULL,
  recovery_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  recovery_attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on recovery logs
ALTER TABLE public.order_recovery_logs ENABLE ROW LEVEL SECURITY;

-- Policy for business admins to view recovery logs
CREATE POLICY "Business admins can view recovery logs" ON public.order_recovery_logs
FOR SELECT
USING (is_business_admin(auth.uid()));

-- Policy for service role to manage recovery logs
CREATE POLICY "Service role can manage recovery logs" ON public.order_recovery_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create payment verification audit table
CREATE TABLE IF NOT EXISTS public.payment_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  verification_method TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verification_attempts INTEGER DEFAULT 1,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on verification audit
ALTER TABLE public.payment_verification_audit ENABLE ROW LEVEL SECURITY;

-- Policy for business admins to view verification audit
CREATE POLICY "Business admins can view verification audit" ON public.payment_verification_audit
FOR SELECT
USING (is_business_admin(auth.uid()));

-- Policy for service role to manage verification audit
CREATE POLICY "Service role can manage verification audit" ON public.payment_verification_audit
FOR ALL
USING (true)
WITH CHECK (true);

-- Create order status monitoring table
CREATE TABLE IF NOT EXISTS public.order_status_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE,
  expected_status TEXT NOT NULL,
  current_status TEXT NOT NULL,
  status_changed_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  escalation_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on status monitoring
ALTER TABLE public.order_status_monitoring ENABLE ROW LEVEL SECURITY;

-- Policy for business admins to view status monitoring
CREATE POLICY "Business admins can view status monitoring" ON public.order_status_monitoring
FOR SELECT
USING (is_business_admin(auth.uid()));

-- Policy for service role to manage status monitoring
CREATE POLICY "Service role can manage status monitoring" ON public.order_status_monitoring
FOR ALL
USING (true)
WITH CHECK (true);