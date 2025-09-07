-- Reset the order's next_retry_at to NOW so we can test immediately
-- This will make it eligible for immediate retry processing

UPDATE public.orders 
SET 
  next_retry_at = NOW() - INTERVAL '1 minute',
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7';

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
  'Reset next_retry_at to NOW for immediate retry testing after 400 error',
  'status_change',
  true
);