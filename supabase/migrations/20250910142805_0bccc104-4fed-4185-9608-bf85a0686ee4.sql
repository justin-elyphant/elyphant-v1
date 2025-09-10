-- Reset order #5b2705 status for ZMA retry
UPDATE public.orders 
SET 
  status = 'processing',
  zinc_status = 'pending_zma',
  zma_error = null,
  retry_count = 0,
  next_retry_at = null,
  updated_at = now()
WHERE id = '7ef8a8bb-5b2f-4169-86ab-17d72df5b2705';