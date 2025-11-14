-- Phase 1: Add checkout_session_id column to orders table
-- This enables Stripe Checkout Sessions as source of truth

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS checkout_session_id TEXT UNIQUE;

-- Index for fast lookups by checkout session
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id 
ON orders(checkout_session_id);

COMMENT ON COLUMN orders.checkout_session_id IS 'Stripe Checkout Session ID - used for idempotency and order tracking';