
-- Add recipient connection tracking to order_items table
ALTER TABLE order_items 
ADD COLUMN recipient_connection_id uuid REFERENCES user_connections(id),
ADD COLUMN delivery_group_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN recipient_gift_message text,
ADD COLUMN scheduled_delivery_date date;

-- Add delivery group tracking to orders table
ALTER TABLE orders
ADD COLUMN has_multiple_recipients boolean DEFAULT false,
ADD COLUMN delivery_groups jsonb DEFAULT '[]'::jsonb;

-- Create index for efficient querying by recipient
CREATE INDEX idx_order_items_recipient_connection ON order_items(recipient_connection_id);
CREATE INDEX idx_order_items_delivery_group ON order_items(delivery_group_id);

-- Update CartItem interface in the cart context
-- This will be handled in the code changes after SQL approval
