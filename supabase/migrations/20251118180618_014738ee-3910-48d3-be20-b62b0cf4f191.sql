-- Add parent order and delivery group tracking for multi-recipient orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS delivery_group_id TEXT;

-- Add index for faster parent order lookups
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

COMMENT ON COLUMN orders.parent_order_id IS 'Reference to parent order for multi-recipient splits';
COMMENT ON COLUMN orders.delivery_group_id IS 'Identifier for delivery group (connectionId or self)';