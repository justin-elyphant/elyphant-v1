-- Stop the specific problematic order from retrying
UPDATE orders 
SET status = 'processing', 
    zinc_status = 'processing',
    updated_at = now()
WHERE id = '1b2de6e6-ddff-4c1c-8581-1ee04a5b2705' 
  AND status = 'retry_pending';