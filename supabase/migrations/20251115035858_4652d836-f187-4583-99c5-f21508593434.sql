-- Phase 2: Simplify orders table
-- Drop dependencies first, then drop legacy columns

-- ============================================================================
-- STEP 1: Drop dependent objects (triggers and views)
-- ============================================================================

DROP TRIGGER IF EXISTS prevent_zinc_api_orders ON orders CASCADE;
DROP VIEW IF EXISTS order_monitoring_summary CASCADE;

-- ============================================================================
-- STEP 2: Add notes field
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================================
-- STEP 3: Rename stripe_session_id to checkout_session_id
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'checkout_session_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN stripe_session_id TO checkout_session_id;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_checkout_session_id_key'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_checkout_session_id_key UNIQUE (checkout_session_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop legacy columns (46 columns)
-- ============================================================================

ALTER TABLE orders DROP COLUMN IF EXISTS zma_order_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS zma_account_used CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS zma_error CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS order_method CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS zinc_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS zinc_timeline_events CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS merchant_tracking_data CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS last_zinc_update CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS subtotal CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_cost CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS tax_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS gifting_fee CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_groups CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_info CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS billing_info CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS has_multiple_recipients CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS is_gift CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS gift_message CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS is_surprise_gift CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS gift_scheduling_options CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS confirmation_email_sent CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_confirmation_sent CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS status_update_emails_sent CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS followup_email_sent CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS retry_count CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS next_retry_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS processing_attempts CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS last_processing_attempt CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS group_gift_project_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS funding_source CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS funding_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS escrow_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS escrow_released_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS retry_reason CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS cancellation_reason CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS webhook_token CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS order_source CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS fulfillment_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_instructions CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS estimated_delivery CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS refund_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS refund_reason CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS refunded_at CASCADE;

-- ============================================================================
-- STEP 5: Add performance indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id ON orders(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_delivery_date ON orders(scheduled_delivery_date) WHERE scheduled_delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_auto_gift_rule_id ON orders(auto_gift_rule_id) WHERE auto_gift_rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_zinc_order_id ON orders(zinc_order_id) WHERE zinc_order_id IS NOT NULL;