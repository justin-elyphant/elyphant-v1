-- Remove over-engineered atomic lock functions and simplify order processing
-- These functions were part of the over-engineered system we're simplifying

DROP FUNCTION IF EXISTS public.acquire_order_submission_lock(uuid);
DROP FUNCTION IF EXISTS public.complete_order_processing(uuid, text, text);
DROP FUNCTION IF EXISTS public.release_order_submission_lock(uuid, text);

-- Drop unnecessary tables used for atomic locking and fingerprinting
DROP TABLE IF EXISTS public.order_processing_signals CASCADE;
DROP TABLE IF EXISTS public.zma_order_validation_cache CASCADE;

-- Simplify orders table - remove unnecessary atomic lock fields
-- Keep essential fields for business logic
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS webhook_token,
DROP COLUMN IF EXISTS order_fingerprint,
DROP COLUMN IF EXISTS atomic_processing_started_at;

-- Keep rate limiting and cost tracking as they provide actual value
-- Keep order_notes for logging and debugging
-- All other order-related tables remain for business functionality

-- Add simple processing state tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS processing_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_processing_attempt TIMESTAMP WITH TIME ZONE;

-- Create simple function to increment processing attempts
CREATE OR REPLACE FUNCTION public.increment_processing_attempts(order_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.orders 
  SET 
    processing_attempts = COALESCE(processing_attempts, 0) + 1,
    last_processing_attempt = now(),
    updated_at = now()
  WHERE id = order_uuid;
END;
$$;