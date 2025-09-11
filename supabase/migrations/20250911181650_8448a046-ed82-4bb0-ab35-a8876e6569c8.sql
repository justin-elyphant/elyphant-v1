-- Update can_cancel_order function to include retry_pending status
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_status text;
  order_zinc_status text;
BEGIN
  SELECT o.status, o.zinc_status INTO order_status, order_zinc_status
  FROM public.orders o
  WHERE o.id = order_id AND o.user_id = auth.uid();
  
  -- Can't cancel if order doesn't exist or doesn't belong to user
  IF order_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Can cancel if status is pending, processing, failed, or retry_pending
  -- Cannot cancel if already shipped, delivered, or cancelled
  RETURN order_status IN ('pending', 'processing', 'failed', 'retry_pending') 
    AND COALESCE(order_zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled');
END;
$$;

-- Update get_order_cancel_eligibility function to include retry_pending
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
  
  -- Check cancellation eligibility including retry_pending
  IF order_record.status IN ('pending', 'processing', 'failed', 'retry_pending') 
     AND COALESCE(order_record.zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled') THEN
    
    result := jsonb_build_object(
      'canCancel', true,
      'status', order_record.status,
      'zinc_status', order_record.zinc_status,
      'isProcessing', order_record.status = 'processing',
      'isRetryPending', order_record.status = 'retry_pending',
      'hasZincOrderId', order_record.zinc_order_id IS NOT NULL,
      'orderAmount', order_record.total_amount,
      'isHighValue', order_record.total_amount > 200,
      'retryCount', order_record.retry_count
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