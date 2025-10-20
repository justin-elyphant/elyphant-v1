-- Fix auto-gift related foreign key constraints to cascade delete
-- This allows account deletion to work properly by cascading deletes to related records

-- Fix auto_gift_notifications constraint to cascade
ALTER TABLE auto_gift_notifications 
DROP CONSTRAINT IF EXISTS auto_gift_notifications_execution_id_fkey;

ALTER TABLE auto_gift_notifications
ADD CONSTRAINT auto_gift_notifications_execution_id_fkey 
FOREIGN KEY (execution_id) 
REFERENCES automated_gift_executions(id) 
ON DELETE CASCADE;

-- Fix auto_gift_data_access constraint to cascade
ALTER TABLE auto_gift_data_access 
DROP CONSTRAINT IF EXISTS auto_gift_data_access_execution_id_fkey;

ALTER TABLE auto_gift_data_access
ADD CONSTRAINT auto_gift_data_access_execution_id_fkey 
FOREIGN KEY (execution_id) 
REFERENCES automated_gift_executions(id) 
ON DELETE CASCADE;