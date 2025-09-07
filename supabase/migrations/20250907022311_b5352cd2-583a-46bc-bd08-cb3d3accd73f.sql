-- Reset the failed order to retry_pending with retry_count = 0 to test our payment verification fix
-- This will give it a fresh start since it was marked as max_retries_exceeded

UPDATE public.orders 
SET 
  status = 'retry_pending',
  retry_count = 0,
  next_retry_at = NOW(),
  zinc_status = NULL,
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7'
  AND status = 'failed';

-- Log the reset action
INSERT INTO public.order_notes (
  order_id,
  admin_user_id,
  note_content,
  note_type,
  is_internal
) VALUES (
  '16cb8901-58ba-4f7d-9116-3c76ba7e19b7',
  '0478a7d7-9d59-40bf-954e-657fa28fe251',
  'Order reset to retry_pending with retry_count = 0 after updating payment verification logic for test payment intents',
  'status_change',
  true
);