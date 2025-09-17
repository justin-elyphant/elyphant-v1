-- Enhanced abort-aware order cancellation functions
-- Update can_cancel_order to be abort-aware
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_status text;
  order_zinc_status text;
  has_zinc_id boolean;
BEGIN
  SELECT o.status, o.zinc_status, (o.zinc_order_id IS NOT NULL)
  INTO order_status, order_zinc_status, has_zinc_id
  FROM public.orders o
  WHERE o.id = order_id AND o.user_id = auth.uid();
  
  -- Can't cancel if order doesn't exist or doesn't belong to user
  IF order_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Can cancel if status allows it and zinc status doesn't prohibit it
  RETURN order_status IN ('pending', 'failed', 'retry_pending') 
    AND COALESCE(order_zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled');
END;
$$;

-- Create new function to check abort eligibility
CREATE OR REPLACE FUNCTION public.can_abort_order(order_id uuid)
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
  WHERE id = order_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canAbort', false,
      'canCancel', false,
      'reason', 'Order not found or access denied'
    );
  END IF;
  
  -- Must have zinc_order_id to abort
  IF order_record.zinc_order_id IS NULL THEN
    RETURN jsonb_build_object(
      'canAbort', false,
      'canCancel', public.can_cancel_order(order_id),
      'reason', 'Order was not processed through Zinc'
    );
  END IF;
  
  -- Check if order is in a state that supports abort
  -- Pending and processing orders with Zinc IDs can potentially be aborted
  IF order_record.status IN ('pending', 'processing') 
     AND COALESCE(order_record.zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled', 'aborted') THEN
    
    RETURN jsonb_build_object(
      'canAbort', true,
      'canCancel', public.can_cancel_order(order_id),
      'reason', 'Order is eligible for abort',
      'isProcessingStage', true,
      'hasZincId', true,
      'orderStatus', order_record.status,
      'zincStatus', order_record.zinc_status
    );
  ELSE
    RETURN jsonb_build_object(
      'canAbort', false,
      'canCancel', public.can_cancel_order(order_id),
      'reason', 'Order has progressed beyond abort eligibility',
      'isProcessingStage', false,
      'hasZincId', true,
      'orderStatus', order_record.status,
      'zincStatus', order_record.zinc_status
    );
  END IF;
END;
$$;

-- Enhanced order cancellation eligibility with abort awareness
CREATE OR REPLACE FUNCTION public.get_order_cancel_eligibility(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  abort_info jsonb;
  result jsonb;
BEGIN
  -- Get order details
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = order_uuid AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canCancel', false,
      'canAbort', false,
      'reason', 'Order not found or access denied'
    );
  END IF;
  
  -- Get abort eligibility
  abort_info := public.can_abort_order(order_uuid);
  
  -- Build comprehensive eligibility response
  result := jsonb_build_object(
    'canCancel', public.can_cancel_order(order_uuid),
    'canAbort', abort_info->>'canAbort' = 'true',
    'abortReason', abort_info->>'reason',
    'isProcessingStage', abort_info->>'isProcessingStage' = 'true',
    'status', order_record.status,
    'zinc_status', order_record.zinc_status,
    'hasZincOrderId', order_record.zinc_order_id IS NOT NULL,
    'orderAmount', order_record.total_amount,
    'isHighValue', order_record.total_amount > 200,
    'retryCount', order_record.retry_count,
    'operationRecommendation', CASE 
      WHEN abort_info->>'canAbort' = 'true' THEN 'abort'
      WHEN public.can_cancel_order(order_uuid) THEN 'cancel'
      ELSE 'none'
    END
  );
  
  RETURN result;
END;
$$;