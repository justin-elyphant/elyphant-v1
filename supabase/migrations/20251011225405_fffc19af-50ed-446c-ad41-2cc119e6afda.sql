-- Phase 1: Add multi-recipient order support columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS parent_order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS delivery_group_id text,
ADD COLUMN IF NOT EXISTS is_split_order boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS split_order_index integer,
ADD COLUMN IF NOT EXISTS total_split_orders integer;

-- Add index for querying split orders
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON public.orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_group_id ON public.orders(delivery_group_id);

-- Add delivery_group_id to order_items for tracking
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS delivery_group_id text;

-- Create index for order items by delivery group
CREATE INDEX IF NOT EXISTS idx_order_items_delivery_group_id ON public.order_items(delivery_group_id);

COMMENT ON COLUMN public.orders.parent_order_id IS 'For split orders, references the original parent order';
COMMENT ON COLUMN public.orders.delivery_group_id IS 'Links to the delivery group this order fulfills';
COMMENT ON COLUMN public.orders.is_split_order IS 'True if this is part of a multi-recipient split order';
COMMENT ON COLUMN public.orders.split_order_index IS 'Index of this split (1 of 3, 2 of 3, etc.)';
COMMENT ON COLUMN public.orders.total_split_orders IS 'Total number of splits for the parent order';