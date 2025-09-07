-- Reset order 16cb8901-58ba-4f7d-9116-3c76ba7e19b7 to retry_pending status
-- This will allow the order to be retried after the process-zma-order function was updated to handle test payments

UPDATE public.orders 
SET 
  status = 'retry_pending',
  next_retry_at = NOW(),
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7'
  AND status = 'payment_verification_failed';

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
  'Order reset to retry_pending after fixing test payment verification logic in process-zma-order function',
  'status_change',
  true
);