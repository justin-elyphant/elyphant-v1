-- Reset the correct order #5007 for ZMA retry 
UPDATE public.orders 
SET 
  status = 'processing',
  zinc_status = 'pending_zma',
  zma_error = null,
  retry_count = 0,
  next_retry_at = null,
  updated_at = now()
WHERE order_number = 'ORD-20250910-5007';