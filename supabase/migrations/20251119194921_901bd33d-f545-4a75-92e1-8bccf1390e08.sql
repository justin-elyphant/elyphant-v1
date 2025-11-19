-- Drop legacy order_items table (replaced by orders.line_items JSONB)
-- This table contains only 4 old delivered test orders from before JSONB consolidation
DROP TABLE IF EXISTS order_items CASCADE;

-- Add comment for audit trail
COMMENT ON TABLE orders IS 'Core orders table - line_items stored in JSONB column (orders.line_items). Legacy order_items table removed 2025-11-19.';