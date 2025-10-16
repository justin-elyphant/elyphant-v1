-- Clean up Curt Davidson's pending connection for fresh testing
-- First, remove the foreign key reference from order_items
UPDATE order_items 
SET recipient_connection_id = NULL 
WHERE recipient_connection_id = '300e6ece-5371-4b77-83b6-85bb5e1f3069';

-- Now delete the pending connection
DELETE FROM user_connections 
WHERE id = '300e6ece-5371-4b77-83b6-85bb5e1f3069'
  AND user_id = '0478a7d7-9d59-40bf-954e-657fa28fe251'
  AND status = 'pending_invitation';