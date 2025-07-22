
-- Add billing_info column to orders table to support separate billing and shipping information
ALTER TABLE orders ADD COLUMN billing_info JSONB DEFAULT NULL;

-- Add index for billing_info queries
CREATE INDEX IF NOT EXISTS idx_orders_billing_info ON orders USING GIN (billing_info);

-- Add comment to document the billing_info structure
COMMENT ON COLUMN orders.billing_info IS 'Stores billing information including cardholder_name, billing_address for cases where billing differs from shipping';
