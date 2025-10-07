-- Fix the advisory lock leak in start_order_processing function
-- and remove unused processing fields

-- Drop unused columns from orders table
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS processing_started_at,
DROP COLUMN IF EXISTS processing_user_id,
DROP COLUMN IF EXISTS processing_status;

-- Recreate start_order_processing function with proper lock cleanup
CREATE OR REPLACE FUNCTION public.start_order_processing(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lock_acquired boolean := false;
  order_data public.orders%ROWTYPE;
  result jsonb;
BEGIN
  -- Try to acquire advisory lock (non-blocking)
  lock_acquired := pg_try_advisory_lock(hashtext(order_uuid::text));
  
  IF NOT lock_acquired THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_locked',
      'message', 'Another process is currently handling this order'
    );
  END IF;

  -- Get order details
  SELECT * INTO order_data
  FROM public.orders
  WHERE id = order_uuid;

  -- Validate order exists
  IF NOT FOUND THEN
    PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'Order not found'
    );
  END IF;

  -- Check if already processed (has zinc_order_id)
  IF order_data.zinc_order_id IS NOT NULL THEN
    PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_processed',
      'message', 'Order already submitted to Zinc',
      'zinc_order_id', order_data.zinc_order_id
    );
  END IF;

  -- Verify payment is successful
  IF order_data.payment_status != 'succeeded' THEN
    PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
    RETURN jsonb_build_object(
      'success', false,
      'error', 'payment_not_verified',
      'message', 'Payment must be verified before processing'
    );
  END IF;

  -- All checks passed - return success (lock remains held)
  result := jsonb_build_object(
    'success', true,
    'message', 'Order locked for processing',
    'order_id', order_uuid,
    'lock_acquired', true
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Release lock on any error
    IF lock_acquired THEN
      PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
    END IF;
    RAISE;
END;
$$;