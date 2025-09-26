-- Create the missing atomic order submission lock function
CREATE OR REPLACE FUNCTION public.acquire_order_submission_lock(order_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Try to acquire the lock by updating the order status atomically
  UPDATE public.orders 
  SET 
    status = 'processing',
    zinc_status = 'submitting',
    updated_at = now()
  WHERE 
    id = order_uuid
    AND status NOT IN ('processing', 'completed', 'cancelled', 'shipped')
    AND zinc_status IS DISTINCT FROM 'submitting'
    AND zinc_order_id IS NULL;
  
  -- Check if we successfully acquired the lock (updated a row)
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  -- Log the lock attempt
  IF rows_affected > 0 THEN
    INSERT INTO public.order_notes (
      order_id,
      note_content,
      note_type,
      is_internal
    ) VALUES (
      order_uuid,
      'Atomic submission lock acquired - order processing started',
      'system_lock',
      true
    );
  END IF;
  
  RETURN rows_affected > 0;
END;
$$;

-- Create companion function to complete order processing atomically
CREATE OR REPLACE FUNCTION public.complete_order_processing(
  order_uuid uuid,
  zinc_order_id_param text,
  final_status text DEFAULT 'completed'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Complete the order processing atomically
  UPDATE public.orders 
  SET 
    zinc_order_id = zinc_order_id_param,
    zinc_status = 'submitted',
    status = final_status,
    updated_at = now()
  WHERE 
    id = order_uuid
    AND status = 'processing'
    AND zinc_status = 'submitting';
  
  -- Check if we successfully completed the processing
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  -- Log the completion
  IF rows_affected > 0 THEN
    INSERT INTO public.order_notes (
      order_id,
      note_content,
      note_type,
      is_internal
    ) VALUES (
      order_uuid,
      'Order processing completed - Zinc order ID: ' || zinc_order_id_param,
      'system_completion',
      true
    );
  END IF;
  
  RETURN rows_affected > 0;
END;
$$;

-- Create function to release lock on failure
CREATE OR REPLACE FUNCTION public.release_order_submission_lock(
  order_uuid uuid,
  error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Release the lock by reverting status
  UPDATE public.orders 
  SET 
    status = 'payment_confirmed',
    zinc_status = NULL,
    updated_at = now()
  WHERE 
    id = order_uuid
    AND status = 'processing'
    AND zinc_status = 'submitting'
    AND zinc_order_id IS NULL;
  
  -- Log the lock release
  INSERT INTO public.order_notes (
    order_id,
    note_content,
    note_type,
    is_internal
  ) VALUES (
    order_uuid,
    'Atomic submission lock released due to error: ' || COALESCE(error_message, 'Unknown error'),
    'system_error',
    true
  );
END;
$$;