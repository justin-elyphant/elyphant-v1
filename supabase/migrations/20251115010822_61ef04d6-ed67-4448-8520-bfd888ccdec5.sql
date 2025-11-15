-- Add receipt_sent_at column to orders table for idempotency
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_receipt_sent ON public.orders(receipt_sent_at) 
WHERE receipt_sent_at IS NOT NULL;