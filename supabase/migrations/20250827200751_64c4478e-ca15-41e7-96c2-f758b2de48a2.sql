-- Clean up duplicate auto-gift executions properly by handling foreign keys
-- First, delete notifications for duplicate executions
DELETE FROM auto_gift_notifications 
WHERE execution_id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, rule_id, execution_date 
             ORDER BY created_at DESC
           ) as rn
    FROM automated_gift_executions 
    WHERE order_id IS NULL 
    AND status = 'completed'
    AND created_at >= '2025-08-26'::date
  ) t WHERE rn > 1
);

-- Then delete the duplicate executions
DELETE FROM automated_gift_executions 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, rule_id, execution_date 
             ORDER BY created_at DESC
           ) as rn
    FROM automated_gift_executions 
    WHERE order_id IS NULL 
    AND status = 'completed'
    AND created_at >= '2025-08-26'::date
  ) t WHERE rn > 1
);

-- Reset remaining completed execution to pending for proper reprocessing
UPDATE automated_gift_executions 
SET status = 'pending', 
    updated_at = now(),
    error_message = NULL
WHERE order_id IS NULL 
AND status = 'completed'
AND created_at >= '2025-08-26'::date;