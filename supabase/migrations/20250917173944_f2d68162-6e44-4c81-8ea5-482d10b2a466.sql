-- Add webhook_token column to orders table for webhook security
ALTER TABLE public.orders ADD COLUMN webhook_token TEXT;

-- Add index for webhook token lookups
CREATE INDEX idx_orders_webhook_token ON public.orders(webhook_token) WHERE webhook_token IS NOT NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.orders.webhook_token IS 'Security token for validating Zinc webhook authenticity';