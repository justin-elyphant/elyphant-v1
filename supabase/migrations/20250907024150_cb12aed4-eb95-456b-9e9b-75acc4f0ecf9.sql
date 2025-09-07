-- Reset the order status from payment_verification_failed to retry_pending
-- This will make it eligible for retry processing again
UPDATE public.orders 
SET 
  status = 'retry_pending',
  next_retry_at = NOW() - INTERVAL '5 minutes',
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7'
  AND status = 'payment_verification_failed';

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
  'Reset status from payment_verification_failed to retry_pending for testing fixed payment verification',
  'status_change',
  true
);