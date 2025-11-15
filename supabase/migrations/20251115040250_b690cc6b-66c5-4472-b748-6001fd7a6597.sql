-- Phase 2 Corrective Migration: Complete Database Simplification
-- Drop remaining legacy columns and add missing target columns

-- Step 1: Add missing target columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zinc_request_id TEXT;

-- Step 2: Drop 21 legacy columns
ALTER TABLE orders
DROP COLUMN IF EXISTS stripe_session_id,
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS gifting_fee_name,
DROP COLUMN IF EXISTS gifting_fee_description,
DROP COLUMN IF EXISTS cancelled_at,
DROP COLUMN IF EXISTS funding_hold_reason,
DROP COLUMN IF EXISTS funding_allocated_at,
DROP COLUMN IF EXISTS expected_funding_date,
DROP COLUMN IF EXISTS parent_order_id,
DROP COLUMN IF EXISTS delivery_group_id,
DROP COLUMN IF EXISTS is_split_order,
DROP COLUMN IF EXISTS split_order_index,
DROP COLUMN IF EXISTS total_split_orders,
DROP COLUMN IF EXISTS cart_data,
DROP COLUMN IF EXISTS thank_you_sent,
DROP COLUMN IF EXISTS thank_you_sent_at,
DROP COLUMN IF EXISTS gift_preview_viewed,
DROP COLUMN IF EXISTS gift_preview_viewed_at,
DROP COLUMN IF EXISTS hold_for_scheduled_delivery,
DROP COLUMN IF EXISTS zinc_scheduled_processing_date,
DROP COLUMN IF EXISTS receipt_sent_at;

-- Step 3: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_fulfilled_at ON orders(fulfilled_at) WHERE fulfilled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery) WHERE estimated_delivery IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_zinc_request_id ON orders(zinc_request_id) WHERE zinc_request_id IS NOT NULL;

-- Verification comment
COMMENT ON TABLE orders IS 'Phase 2 Complete: Simplified to 22 core columns for Checkout Sessions architecture';