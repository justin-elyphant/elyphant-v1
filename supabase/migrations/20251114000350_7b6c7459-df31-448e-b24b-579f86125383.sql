-- Phase 2: Database Migration for Modernized Payment Flow
-- Remove cart_session_id dependency from orders, add payment_intent_id

-- Step 1: Add payment_intent_id column to orders if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_intent_id text;
    CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
  END IF;
END $$;

-- Step 2: Remove cart_session_id foreign key and column from orders
-- (Keep cart_sessions table for abandoned cart recovery, but remove from order creation flow)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_cart_session_id_fkey;
ALTER TABLE orders DROP COLUMN IF EXISTS cart_session_id;

-- Step 3: Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id_created 
ON orders(payment_intent_id, created_at DESC);

-- Step 4: Update orders table comments to reflect v2 architecture
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe Payment Intent ID - source of truth for v2 orders';
COMMENT ON TABLE orders IS 'Orders table - v2 uses payment_intent_id as primary lookup key from webhooks';

-- Step 5: Clean up any orphaned cart_sessions that reference non-existent orders
-- (This is safe because cart_sessions is now only for abandoned cart tracking)
DELETE FROM cart_sessions 
WHERE completed_at IS NOT NULL 
AND created_at < NOW() - INTERVAL '30 days';

COMMENT ON TABLE cart_sessions IS 'Abandoned cart tracking only - NOT used for order creation in v2';
