-- Reset the order status to retry_pending and set next_retry_at to past time
-- This will make it eligible for immediate retry processing

UPDATE public.orders 
SET 
  status = 'retry_pending',
  next_retry_at = NOW() - INTERVAL '5 minutes',
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7';

-- Log the status change
INSERT INTO public.order_notes (
  order_id,
  admin_user_id,
  note_content,
  note_type,
  is_internal
) VALUES (
  '16cb8901-58ba-4f7d-9116-3c76ba7e19b7',
  '0478a7d7-9d59-40bf-954e-657fa28fe251',
  'Reset status to retry_pending for immediate retry testing',
  'status_change',
  true
);