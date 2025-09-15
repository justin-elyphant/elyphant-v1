-- Create atomic order submission lock function
CREATE OR REPLACE FUNCTION public.acquire_order_submission_lock(order_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Attempt to atomically claim the order for processing
  -- Only succeeds if zinc_order_id is NULL and status allows processing
  UPDATE public.orders 
  SET zinc_status = 'submitting',
      status = 'processing',
      updated_at = now()
  WHERE id = order_uuid 
    AND zinc_order_id IS NULL 
    AND zinc_status NOT IN ('submitting', 'submitted', 'completed')
    AND status NOT IN ('completed', 'cancelled', 'shipped');
  
  -- Return true if we successfully claimed it, false if another process got it
  RETURN FOUND;
END;
$$;

-- Create function to safely update zinc_order_id (idempotent)
CREATE OR REPLACE FUNCTION public.set_zinc_order_id_if_null(order_uuid uuid, zinc_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  -- Only update zinc_order_id if it's currently NULL
  UPDATE public.orders 
  SET zinc_order_id = zinc_id,
      zinc_status = 'submitted',
      status = 'processing',
      updated_at = now()
  WHERE id = order_uuid 
    AND zinc_order_id IS NULL;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  -- Return true if we successfully updated, false if zinc_order_id was already set
  RETURN updated_rows > 0;
END;
$$;