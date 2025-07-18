-- Add new order statuses to improve order management
-- First add a function to check if order can be cancelled
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_status text;
  zinc_status text;
BEGIN
  SELECT status, zinc_status INTO order_status, zinc_status
  FROM orders 
  WHERE id = order_id AND user_id = auth.uid();
  
  -- Can't cancel if order doesn't exist or doesn't belong to user
  IF order_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Can cancel if status is pending, processing, or failed
  -- Cannot cancel if already shipped, delivered, or cancelled
  RETURN order_status IN ('pending', 'processing', 'failed') 
    AND COALESCE(zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled');
END;
$$;

-- Add function to cleanup old failed orders
CREATE OR REPLACE FUNCTION public.cleanup_failed_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Mark orders as failed if they've been pending for more than 24 hours
  UPDATE orders 
  SET status = 'failed', 
      updated_at = now()
  WHERE status = 'pending' 
    AND created_at < now() - interval '24 hours'
    AND payment_status != 'succeeded';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Add function to cancel an order
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason text DEFAULT 'User cancelled')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record orders%ROWTYPE;
  result json;
BEGIN
  -- Check if order can be cancelled
  IF NOT public.can_cancel_order(order_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order cannot be cancelled in its current state'
    );
  END IF;
  
  -- Get order details
  SELECT * INTO order_record
  FROM orders 
  WHERE id = order_id AND user_id = auth.uid();
  
  -- Update order status
  UPDATE orders 
  SET status = 'cancelled',
      zinc_status = 'cancelled',
      updated_at = now()
  WHERE id = order_id AND user_id = auth.uid();
  
  -- Insert audit log
  INSERT INTO order_notes (
    order_id, 
    admin_user_id, 
    note_content, 
    note_type, 
    is_internal
  ) VALUES (
    order_id,
    auth.uid(),
    'Order cancelled by user: ' || cancellation_reason,
    'cancellation',
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order cancelled successfully',
    'order_id', order_id
  );
END;
$$;