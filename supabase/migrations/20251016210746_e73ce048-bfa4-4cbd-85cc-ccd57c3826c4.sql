-- First delete order items referencing this connection
DELETE FROM order_items 
WHERE recipient_connection_id = '7f00a6d3-cfed-4a1e-93b2-d994bb52ceae';

-- Then delete the incomplete pending connection for Curt Davidson
DELETE FROM user_connections 
WHERE id = '7f00a6d3-cfed-4a1e-93b2-d994bb52ceae';