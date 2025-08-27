-- Clean up duplicate auto-gift executions with null order_id and same rule/date
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