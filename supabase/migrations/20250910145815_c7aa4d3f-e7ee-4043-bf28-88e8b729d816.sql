-- Reset order #5007 to test gift message fix
UPDATE public.orders 
SET 
  status = 'processing',
  zinc_status = 'pending_zma',
  zma_error = null,
  retry_count = 0,
  next_retry_at = null,
  updated_at = now()
WHERE id = '1b2de6e6-ddff-4c1c-8581-1ee04a5b2705';