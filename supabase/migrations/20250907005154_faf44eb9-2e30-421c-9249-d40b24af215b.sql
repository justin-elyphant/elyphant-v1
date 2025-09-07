-- Phase 1: Fix the stuck order by updating its status to retry_pending
UPDATE orders 
SET 
  status = 'retry_pending',
  next_retry_at = now(),
  updated_at = now()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7' 
  AND status = 'processing';

-- Phase 3: Check for other stuck orders that might need similar fixes
-- Find orders stuck in processing for more than 2 hours
SELECT id, order_number, status, created_at, updated_at, next_retry_at, retry_count
FROM orders 
WHERE status = 'processing' 
  AND updated_at < (now() - interval '2 hours')
ORDER BY updated_at ASC;