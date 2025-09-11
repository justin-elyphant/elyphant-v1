-- Fix security warnings from the linter

-- Remove the problematic SECURITY DEFINER view and create a regular view
DROP VIEW IF EXISTS public.order_monitoring_summary;

-- Create a regular view without SECURITY DEFINER
CREATE VIEW public.order_monitoring_summary AS
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

-- Fix function search paths by recreating with proper SET search_path
CREATE OR REPLACE FUNCTION public.update_admin_alerts_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_refund_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the order cancellation function with proper search path
CREATE OR REPLACE FUNCTION public.get_order_cancel_eligibility(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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