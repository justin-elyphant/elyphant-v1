-- Phase 1: Add funding status columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS funding_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS funding_hold_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expected_funding_date timestamptz;

-- Add comments for clarity
COMMENT ON COLUMN public.orders.funding_status IS 'Funding status: null (normal), awaiting_funds, funds_allocated';
COMMENT ON COLUMN public.orders.funding_hold_reason IS 'Explanation if order is held due to insufficient ZMA funds';
COMMENT ON COLUMN public.orders.expected_funding_date IS 'Expected date when ZMA funds will be available';

-- Add index for awaiting_funds orders
CREATE INDEX IF NOT EXISTS idx_orders_funding_status ON public.orders(funding_status) WHERE funding_status IS NOT NULL;

-- Phase 3: Create zma_funding_alerts table for tracking low balance alerts
CREATE TABLE IF NOT EXISTS public.zma_funding_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL CHECK (alert_type IN ('low_balance', 'critical_balance', 'pending_orders_waiting')),
  zma_current_balance numeric NOT NULL,
  pending_orders_value numeric NOT NULL DEFAULT 0,
  recommended_transfer_amount numeric DEFAULT 0,
  orders_count_waiting integer DEFAULT 0,
  alert_sent_at timestamptz NOT NULL DEFAULT now(),
  email_sent boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on zma_funding_alerts
ALTER TABLE public.zma_funding_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage alerts (via service role in edge functions)
CREATE POLICY "Service role can manage zma_funding_alerts"
  ON public.zma_funding_alerts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comment for clarity
COMMENT ON TABLE public.zma_funding_alerts IS 'Tracks ZMA low balance alerts to prevent duplicate notifications';