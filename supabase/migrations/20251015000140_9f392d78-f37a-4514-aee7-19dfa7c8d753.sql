-- Add columns to orders table for multi-recipient support
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cart_session_id uuid REFERENCES public.cart_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cart_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS has_multiple_recipients boolean DEFAULT false;

-- Add index for cart_session_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_cart_session_id ON public.orders(cart_session_id);

-- Add comment to document the columns
COMMENT ON COLUMN public.orders.cart_data IS 'Full cart data including deliveryGroups for multi-recipient orders';
COMMENT ON COLUMN public.orders.has_multiple_recipients IS 'Flag to indicate if this order has multiple recipients and needs splitting';
COMMENT ON COLUMN public.orders.cart_session_id IS 'Reference to the cart session that created this order';