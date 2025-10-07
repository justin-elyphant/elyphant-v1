-- Create webhook delivery log table for monitoring
CREATE TABLE IF NOT EXISTS public.webhook_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT,
  stripe_signature TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received',
  status_code INTEGER,
  error_message TEXT,
  payment_intent_id TEXT,
  order_id UUID,
  processing_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_webhook_log_payment_intent ON public.webhook_delivery_log(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_order_id ON public.webhook_delivery_log(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created_at ON public.webhook_delivery_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_log_status ON public.webhook_delivery_log(delivery_status);

-- Enable RLS
ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

-- Business admins can view webhook logs
CREATE POLICY "Business admins can view webhook logs"
  ON public.webhook_delivery_log
  FOR SELECT
  TO authenticated
  USING (is_business_admin(auth.uid()));

-- Service role can insert webhook logs
CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_delivery_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.webhook_delivery_log IS 'Tracks all Stripe webhook deliveries for monitoring and debugging';