-- Fix foreign key constraints for account deletion
-- Industry standard: SET NULL for order items (preserve order history), CASCADE for connections

-- Fix user_connections to cascade delete when user profile is deleted
ALTER TABLE user_connections 
DROP CONSTRAINT IF EXISTS user_connections_user_id_fkey;

ALTER TABLE user_connections
ADD CONSTRAINT user_connections_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Also fix the connected_user_id constraint to cascade
ALTER TABLE user_connections 
DROP CONSTRAINT IF EXISTS user_connections_connected_user_id_fkey;

ALTER TABLE user_connections
ADD CONSTRAINT user_connections_connected_user_id_fkey 
FOREIGN KEY (connected_user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Fix order_items to SET NULL on connection deletion (preserves order history)
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_recipient_connection_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_recipient_connection_id_fkey 
FOREIGN KEY (recipient_connection_id) 
REFERENCES user_connections(id) 
ON DELETE SET NULL;