-- Add columns to support deferred payment for far-future scheduled orders
-- These store Stripe payment credentials for orders placed 8+ days before delivery

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

COMMENT ON COLUMN public.orders.payment_method_id IS 'Stripe payment method ID for deferred/setup mode orders (saved card for later authorization)';
COMMENT ON COLUMN public.orders.stripe_customer_id IS 'Stripe customer ID for deferred payment orders';

-- Add index for efficient lookup of pending_payment orders
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment 
ON public.orders (status, scheduled_delivery_date) 
WHERE status = 'pending_payment';