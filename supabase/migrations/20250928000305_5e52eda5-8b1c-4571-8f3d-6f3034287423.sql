-- Add webhook_token column to orders table for secure webhook validation
ALTER TABLE public.orders 
ADD COLUMN webhook_token text;

-- Create index for efficient webhook token lookups
CREATE INDEX IF NOT EXISTS idx_orders_webhook_token ON public.orders(webhook_token) 
WHERE webhook_token IS NOT NULL;