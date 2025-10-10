-- ========================================================================
-- HYBRID APPROACH: Fix Payment Intents Flow While Keeping Both Systems
-- ========================================================================
-- This migration adds cleanup for abandoned payment intents and supporting
-- infrastructure for deferred order creation

-- Step 1: Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_orders_abandoned_cleanup 
ON orders (created_at, status, payment_status, stripe_payment_intent_id)
WHERE status = 'pending_payment' AND payment_status = 'pending';

-- Step 2: Create cleanup function for abandoned orders (payment intent flow only)
-- These are orders created on page load but never completed
CREATE OR REPLACE FUNCTION cleanup_abandoned_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete orders that are:
  -- 1. Older than 1 hour
  -- 2. Status = 'pending_payment'
  -- 3. Payment status = 'pending'
  -- 4. Have a payment intent ID (not checkout session orders)
  -- 5. Don't have a successful payment
  DELETE FROM orders 
  WHERE status = 'pending_payment' 
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour'
    AND stripe_payment_intent_id IS NOT NULL
    AND stripe_session_id IS NULL; -- Only clean up payment intent orders
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % abandoned orders', deleted_count;
  END IF;
  
  RETURN deleted_count;
END;
$$;

-- Step 3: Schedule cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-abandoned-orders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT cleanup_abandoned_orders();
  $$
);

-- Step 4: Create a table to track payment intent deduplication
-- This prevents creating multiple payment intents for the same cart
CREATE TABLE IF NOT EXISTS payment_intents_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_fingerprint TEXT NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_intents_cache_lookup 
ON payment_intents_cache (user_id, request_fingerprint, created_at);

-- Add RLS policies
ALTER TABLE payment_intents_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment intent cache"
ON payment_intents_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment intent cache"
ON payment_intents_cache FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 5: Create cleanup function for expired payment intent cache
CREATE OR REPLACE FUNCTION cleanup_payment_intent_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM payment_intents_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % expired payment intent cache entries', deleted_count;
  END IF;
  
  RETURN deleted_count;
END;
$$;

-- Schedule cache cleanup to run every hour
SELECT cron.schedule(
  'cleanup-payment-intent-cache',
  '15 * * * *', -- Every hour at minute 15
  $$
  SELECT cleanup_payment_intent_cache();
  $$
);

-- Step 6: Add comment explaining the system
COMMENT ON FUNCTION cleanup_abandoned_orders() IS 
'Cleans up abandoned orders from payment intent flow that were created on page load but never completed. Runs hourly via cron job.';

COMMENT ON FUNCTION cleanup_payment_intent_cache() IS 
'Cleans up expired payment intent cache entries to prevent table bloat. Runs hourly via cron job.';

COMMENT ON TABLE payment_intents_cache IS 
'Caches payment intent IDs to prevent duplicate creation when users refresh checkout page. Entries expire after 1 hour.';