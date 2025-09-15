-- Phase 1: Add processing lock and enhance duplicate prevention
-- Add processing_status field to orders table for atomic processing control
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'ready';

-- Add unique constraint on zinc_order_id to prevent database-level duplicates
ALTER TABLE public.orders 
ADD CONSTRAINT unique_zinc_order_id UNIQUE (zinc_order_id);

-- Add index for faster processing_status lookups
CREATE INDEX IF NOT EXISTS idx_orders_processing_status ON public.orders(processing_status);

-- Add request fingerprinting table for duplicate request detection
CREATE TABLE IF NOT EXISTS public.order_request_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_fingerprint text NOT NULL,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '1 hour'),
  request_metadata jsonb DEFAULT '{}'::jsonb
);

-- Add unique constraint on fingerprint to prevent duplicate requests
ALTER TABLE public.order_request_fingerprints 
ADD CONSTRAINT unique_request_fingerprint UNIQUE (request_fingerprint);

-- Add index for fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_fingerprints_user_created ON public.order_request_fingerprints(user_id, created_at);

-- Add RLS policy for request fingerprints
ALTER TABLE public.order_request_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own request fingerprints" 
ON public.order_request_fingerprints 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add enhanced order processing function for atomic check-and-set
CREATE OR REPLACE FUNCTION public.start_order_processing(
  order_uuid uuid,
  processing_user uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record orders%ROWTYPE;
  result jsonb;
BEGIN
  -- Use advisory lock to prevent race conditions
  IF NOT pg_try_advisory_lock(hashtext(order_uuid::text)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_locked',
      'message', 'Order is currently being processed by another request'
    );
  END IF;
  
  BEGIN
    -- Get current order status
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
    
    -- Check if order already has zinc_order_id (duplicate prevention)
    IF order_record.zinc_order_id IS NOT NULL AND order_record.status NOT IN ('failed', 'cancelled') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_processed',
        'message', 'Order already has Zinc order ID and is not failed',
        'zinc_order_id', order_record.zinc_order_id,
        'current_status', order_record.status
      );
    END IF;
    
    -- Check if order is already being processed
    IF order_record.processing_status = 'processing' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_processing',
        'message', 'Order is currently being processed'
      );
    END IF;
    
    -- Check payment status
    IF order_record.payment_status NOT IN ('succeeded', 'test_succeeded') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'payment_not_verified',
        'message', 'Payment status must be succeeded before processing',
        'current_payment_status', order_record.payment_status
      );
    END IF;
    
    -- Set processing status atomically
    UPDATE orders 
    SET 
      processing_status = 'processing',
      processing_started_at = now(),
      processing_user_id = processing_user,
      updated_at = now()
    WHERE id = order_uuid;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Order processing started successfully',
      'order_id', order_uuid,
      'previous_status', order_record.status
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'processing_error',
      'message', SQLERRM
    );
  END;
  
  -- Release the advisory lock
  PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
END;
$$;

-- Add function to complete order processing
CREATE OR REPLACE FUNCTION public.complete_order_processing(
  order_uuid uuid,
  zinc_order_id_param text DEFAULT NULL,
  final_status text DEFAULT 'processing',
  error_message text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE orders 
  SET 
    processing_status = 'completed',
    zinc_order_id = COALESCE(zinc_order_id_param, zinc_order_id),
    status = final_status,
    processing_completed_at = now(),
    processing_error = error_message,
    updated_at = now()
  WHERE id = order_uuid;
  
  -- Release the advisory lock
  PERFORM pg_advisory_unlock(hashtext(order_uuid::text));
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order processing completed',
    'final_status', final_status
  );
END;
$$;

-- Add function to check request fingerprint
CREATE OR REPLACE FUNCTION public.check_request_fingerprint(
  fingerprint_param text,
  user_uuid uuid,
  order_uuid uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_fingerprint order_request_fingerprints%ROWTYPE;
BEGIN
  -- Clean up expired fingerprints first
  DELETE FROM order_request_fingerprints 
  WHERE expires_at < now();
  
  -- Check for existing fingerprint
  SELECT * INTO existing_fingerprint
  FROM order_request_fingerprints
  WHERE request_fingerprint = fingerprint_param;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'is_duplicate', true,
      'existing_order_id', existing_fingerprint.order_id,
      'created_at', existing_fingerprint.created_at,
      'message', 'Duplicate request detected'
    );
  END IF;
  
  -- Insert new fingerprint
  INSERT INTO order_request_fingerprints (
    user_id, 
    request_fingerprint, 
    order_id,
    request_metadata
  ) VALUES (
    user_uuid,
    fingerprint_param,
    order_uuid,
    jsonb_build_object('created_by', 'order_processing')
  );
  
  RETURN jsonb_build_object(
    'is_duplicate', false,
    'message', 'Request fingerprint recorded'
  );
END;
$$;

-- Add cleanup function for expired fingerprints
CREATE OR REPLACE FUNCTION public.cleanup_expired_fingerprints()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM order_request_fingerprints 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;