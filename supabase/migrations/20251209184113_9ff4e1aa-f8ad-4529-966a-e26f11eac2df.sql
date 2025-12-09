-- Add payment_confirmed to order status flow
-- This enables two-stage processing: capture payment early, submit to Zinc later

-- Create a check constraint to ensure payment_confirmed is a valid status
-- The orders table already uses text for status, so we just need to document the new status

-- Add a comment to document the order status flow
COMMENT ON COLUMN public.orders.status IS 'Order status flow: pending → scheduled (for future delivery) → payment_confirmed (payment captured, awaiting fulfillment) → processing (submitted to Zinc) → shipped → delivered. Also: failed, cancelled';

-- Add index for efficient queries on payment_confirmed status
CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed 
ON public.orders(status, scheduled_delivery_date) 
WHERE status = 'payment_confirmed';

-- Add index for scheduled orders awaiting capture
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_capture 
ON public.orders(status, payment_status, scheduled_delivery_date) 
WHERE status = 'scheduled' AND payment_status = 'authorized';