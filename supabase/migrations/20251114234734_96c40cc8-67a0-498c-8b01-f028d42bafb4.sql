-- Phase 2 alignment: add missing target-state columns used by stripe-webhook-v2
-- Safe, additive migration to unblock order creation from Checkout Sessions

-- 1) Orders: add modern columns expected by webhook
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS line_items jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS is_auto_gift boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_gift_rule_id uuid;

-- 2) Minimal indexes for lookups (optional but helpful)
-- Note: checkout_session_id already exists and is used for idempotency
CREATE INDEX IF NOT EXISTS idx_orders_auto_gift_rule_id ON public.orders(auto_gift_rule_id);

-- Leave existing legacy columns in place for now; cleanup comes after Phase 2 migration
