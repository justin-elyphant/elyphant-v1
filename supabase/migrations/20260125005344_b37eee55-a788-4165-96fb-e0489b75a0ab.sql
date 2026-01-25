-- Add setup_intent_id column to store the Stripe SetupIntent for deferred payment orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS setup_intent_id TEXT;

COMMENT ON COLUMN public.orders.setup_intent_id IS 'Stripe SetupIntent ID for deferred payment orders - used to retrieve payment method at authorization time';