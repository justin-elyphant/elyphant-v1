-- Enhanced order management tables for comprehensive tracking and admin oversight

-- Create admin alerts table for monitoring critical issues
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  order_id UUID REFERENCES public.orders(id),
  user_id UUID,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  requires_action BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for admin alerts
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON public.admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_requires_action ON public.admin_alerts(requires_action);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON public.admin_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_order_id ON public.admin_alerts(order_id);

-- Create refund requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payment_intent_id TEXT,
  stripe_refund_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for refund requests
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON public.refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON public.refund_requests(created_at);

-- Add cancellation tracking fields to orders table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE public.orders ADD COLUMN cancellation_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancelled_at') THEN
    ALTER TABLE public.orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create enhanced order monitoring view
CREATE OR REPLACE VIEW public.order_monitoring_summary AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.zinc_status,
  o.total_amount,
  o.created_at,
  o.updated_at,
  o.retry_count,
  o.next_retry_at,
  o.cancellation_reason,
  o.cancelled_at,
  CASE 
    WHEN o.status = 'retry_pending' AND o.retry_count >= 3 THEN 'max_retries_reached'
    WHEN o.status = 'processing' AND o.updated_at < (now() - INTERVAL '24 hours') THEN 'stuck_processing'
    WHEN o.status = 'failed' THEN 'requires_investigation'
    WHEN o.status = 'cancelled' THEN 'cancelled'
    ELSE 'normal'
  END as monitoring_status,
  EXISTS (
    SELECT 1 FROM public.admin_alerts aa 
    WHERE aa.order_id = o.id AND aa.resolved = false
  ) as has_active_alerts,
  EXISTS (
    SELECT 1 FROM public.refund_requests rr 
    WHERE rr.order_id = o.id AND rr.status IN ('pending', 'processing')
  ) as has_pending_refund
FROM public.orders o
WHERE o.created_at > (now() - INTERVAL '30 days');

-- Enable RLS on new tables
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin alerts
CREATE POLICY "Admin alerts viewable by business admins" 
ON public.admin_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins ba
    WHERE ba.user_id = auth.uid()
    AND ba.admin_level IN ('owner', 'admin')
  )
);

CREATE POLICY "Admin alerts manageable by business admins" 
ON public.admin_alerts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins ba
    WHERE ba.user_id = auth.uid()
    AND ba.admin_level IN ('owner', 'admin')
  )
);

-- Create RLS policies for refund requests
CREATE POLICY "Users can view their own refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = refund_requests.order_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Business admins can view all refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins ba
    WHERE ba.user_id = auth.uid()
    AND ba.admin_level IN ('owner', 'admin')
  )
);

CREATE POLICY "System can manage refund requests" 
ON public.refund_requests 
FOR ALL 
USING (auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.business_admins ba
    WHERE ba.user_id = auth.uid()
    AND ba.admin_level IN ('owner', 'admin')
  )
);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_admin_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers
DROP TRIGGER IF EXISTS update_admin_alerts_updated_at ON public.admin_alerts;
CREATE TRIGGER update_admin_alerts_updated_at
  BEFORE UPDATE ON public.admin_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_alerts_updated_at();

DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON public.refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_refund_requests_updated_at();

-- Create function to get order cancellation eligibility
CREATE OR REPLACE FUNCTION public.get_order_cancel_eligibility(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  result jsonb;
BEGIN
  -- Get order details
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = order_uuid AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canCancel', false,
      'reason', 'Order not found or access denied'
    );
  END IF;
  
  -- Check cancellation eligibility
  IF order_record.status IN ('pending', 'processing', 'failed') 
     AND COALESCE(order_record.zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled') THEN
    
    result := jsonb_build_object(
      'canCancel', true,
      'status', order_record.status,
      'zinc_status', order_record.zinc_status,
      'isProcessing', order_record.status = 'processing',
      'hasZincOrderId', order_record.zinc_order_id IS NOT NULL,
      'orderAmount', order_record.total_amount,
      'isHighValue', order_record.total_amount > 200
    );
  ELSE
    result := jsonb_build_object(
      'canCancel', false,
      'reason', 'Order cannot be cancelled in current status',
      'status', order_record.status,
      'zinc_status', order_record.zinc_status
    );
  END IF;
  
  RETURN result;
END;
$$;