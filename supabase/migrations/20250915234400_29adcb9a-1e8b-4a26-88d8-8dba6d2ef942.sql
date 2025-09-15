-- Fix the complete order functions to work with existing table structure
-- First, let's update the functions to use existing columns only

CREATE OR REPLACE FUNCTION public.complete_order_processing(
  order_uuid uuid,
  zinc_request_id_param text,
  zinc_status_param text DEFAULT 'submitted',
  final_status_param text DEFAULT 'submitted_to_zinc',
  error_message_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record orders%ROWTYPE;
  rows_updated integer;
BEGIN
  -- Get current order status first
  SELECT * INTO order_record 
  FROM orders 
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'Order not found'
    );
  END IF;

  -- Atomically update the order with Zinc information
  UPDATE orders 
  SET 
    zinc_order_id = zinc_request_id_param,
    zinc_status = zinc_status_param,
    status = final_status_param,
    updated_at = now()
  WHERE id = order_uuid;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'Order not found for update'
    );
  END IF;

  -- Release the advisory lock
  PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order processing completed successfully',
    'order_id', order_uuid,
    'zinc_order_id', zinc_request_id_param,
    'final_status', final_status_param,
    'zinc_status', zinc_status_param
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Release the advisory lock on error
  PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'completion_error',
    'message', SQLERRM,
    'sql_state', SQLSTATE
  );
END;
$$;

-- Update the manually_complete_order function
CREATE OR REPLACE FUNCTION public.manually_complete_order(
  order_uuid uuid,
  zinc_request_id_param text,
  zinc_status_param text DEFAULT 'submitted',
  final_status_param text DEFAULT 'submitted_to_zinc'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Force complete the order regardless of current state
  UPDATE orders 
  SET 
    zinc_order_id = zinc_request_id_param,
    zinc_status = zinc_status_param,
    status = final_status_param,
    updated_at = now()
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'Order not found'
    );
  END IF;
  
  -- Release any advisory locks
  PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order manually completed successfully',
    'order_id', order_uuid,
    'zinc_order_id', zinc_request_id_param
  );
END;
$$;

-- Update the recovery function
CREATE OR REPLACE FUNCTION public.recover_stuck_orders(
  max_age_minutes integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stuck_order_count integer := 0;
  recovered_count integer := 0;
  order_record record;
  recovery_results jsonb := '[]'::jsonb;
BEGIN
  -- Find orders stuck in submitting status for more than max_age_minutes
  FOR order_record IN
    SELECT id, order_number, created_at, zinc_status, status
    FROM orders 
    WHERE zinc_status = 'submitting'
      AND zinc_order_id IS NULL
      AND status = 'processing'
      AND created_at < (now() - (max_age_minutes || ' minutes')::interval)
  LOOP
    stuck_order_count := stuck_order_count + 1;
    
    -- Reset the order to allow reprocessing
    UPDATE orders 
    SET 
      zinc_status = NULL,
      status = 'payment_confirmed',
      updated_at = now()
    WHERE id = order_record.id;
    
    recovered_count := recovered_count + 1;
    
    -- Add to results
    recovery_results := recovery_results || jsonb_build_object(
      'order_id', order_record.id,
      'order_number', order_record.order_number,
      'stuck_since', order_record.created_at,
      'recovered_at', now()
    );
    
    -- Release any advisory locks
    PERFORM pg_advisory_unlock(hashtext(order_record.id::text));
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'stuck_orders_found', stuck_order_count,
    'orders_recovered', recovered_count,
    'recovered_orders', recovery_results,
    'execution_time', now()
  );
END;
$$;