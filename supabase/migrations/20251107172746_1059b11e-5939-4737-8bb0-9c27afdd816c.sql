-- ========================================================================
-- AUTO-GIFT PAYMENT FLOW IMPROVEMENTS - DATABASE SCHEMA
-- ========================================================================
-- This migration adds payment method validation, payment intent tracking,
-- retry logic, and async fulfillment capabilities to the auto-gifting system.

-- ========================================================================
-- Priority 1: Payment Method Health Monitoring
-- ========================================================================

-- Add payment method validation columns to auto_gifting_rules
ALTER TABLE auto_gifting_rules
ADD COLUMN IF NOT EXISTS payment_method_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS payment_method_last_verified TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method_validation_error TEXT;

-- Index for efficient querying of payment status
CREATE INDEX IF NOT EXISTS idx_auto_gifting_rules_payment_status 
ON auto_gifting_rules(payment_method_status, payment_method_last_verified);

-- ========================================================================
-- Priority 2: Payment Intent Tracking & Priority 4: Retry Logic
-- ========================================================================

-- Add payment intent tracking and retry columns to automated_gift_executions
ALTER TABLE automated_gift_executions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_error_message TEXT,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_payment_retry_at TIMESTAMPTZ;

-- Index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_executions_payment_intent 
ON automated_gift_executions(stripe_payment_intent_id);

-- Index for retry processing
CREATE INDEX IF NOT EXISTS idx_executions_retry_queue 
ON automated_gift_executions(status, next_payment_retry_at) 
WHERE status = 'payment_retry_pending';

-- Create payment audit log for dispute resolution and tracking
CREATE TABLE IF NOT EXISTS auto_gift_payment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES automated_gift_executions(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_method_id TEXT,
  error_message TEXT,
  stripe_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_execution ON auto_gift_payment_audit(execution_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_intent ON auto_gift_payment_audit(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_created ON auto_gift_payment_audit(created_at);

-- ========================================================================
-- Priority 5: Decouple Payment & Fulfillment
-- ========================================================================

-- Create fulfillment queue for async order processing
CREATE TABLE IF NOT EXISTS auto_gift_fulfillment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES automated_gift_executions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_queue_status 
ON auto_gift_fulfillment_queue(status, created_at) 
WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_fulfillment_queue_execution 
ON auto_gift_fulfillment_queue(execution_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fulfillment_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fulfillment_queue_updated_at_trigger ON auto_gift_fulfillment_queue;
CREATE TRIGGER fulfillment_queue_updated_at_trigger
  BEFORE UPDATE ON auto_gift_fulfillment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_fulfillment_queue_updated_at();

-- ========================================================================
-- RLS Policies for New Tables
-- ========================================================================

-- Enable RLS on new tables
ALTER TABLE auto_gift_payment_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_gift_fulfillment_queue ENABLE ROW LEVEL SECURITY;

-- Payment audit policies (users can view their own audit logs)
CREATE POLICY "Users can view their own payment audit logs"
ON auto_gift_payment_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM automated_gift_executions e
    WHERE e.id = auto_gift_payment_audit.execution_id
    AND e.user_id = auth.uid()
  )
);

-- Fulfillment queue policies (users can view their own fulfillment queue)
CREATE POLICY "Users can view their own fulfillment queue"
ON auto_gift_fulfillment_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM automated_gift_executions e
    WHERE e.id = auto_gift_fulfillment_queue.execution_id
    AND e.user_id = auth.uid()
  )
);

-- ========================================================================
-- Helpful Comments for Future Reference
-- ========================================================================

COMMENT ON COLUMN auto_gifting_rules.payment_method_status IS 
'Payment method validation status: unknown, valid, expired, invalid, detached. Updated by validate-payment-methods cron.';

COMMENT ON COLUMN automated_gift_executions.payment_status IS 
'Payment lifecycle status: pending, succeeded, failed, retrying. Tracked throughout payment flow.';

COMMENT ON TABLE auto_gift_payment_audit IS 
'Audit log for all auto-gift payment attempts. Critical for dispute resolution and debugging.';

COMMENT ON TABLE auto_gift_fulfillment_queue IS 
'Async fulfillment queue. Decouples payment confirmation from Zinc order placement to prevent timeouts.';