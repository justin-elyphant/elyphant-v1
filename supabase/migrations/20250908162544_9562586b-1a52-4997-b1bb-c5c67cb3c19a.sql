-- Update the successfully processing order from retry_pending to processing
UPDATE public.orders 
SET 
  status = 'processing',
  zinc_status = 'request_processing',
  next_retry_at = NOW() + INTERVAL '10 minutes', -- Check again in 10 minutes
  updated_at = NOW()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7'
  AND status = 'retry_pending';

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
  'Updated to processing status - Zinc confirmed order is actively processing (request_id: 67e341cbcbda17f50b242294c97feaa2)',
  'status_change',
  true
);

-- Clean up the other failed orders without zinc_order_id
UPDATE public.orders 
SET 
  status = 'failed',
  updated_at = NOW()
WHERE status = 'payment_verification_failed'
  AND zinc_order_id IS NULL;

-- Log cleanup
INSERT INTO public.order_notes (
  order_id,
  admin_user_id,
  note_content,
  note_type,
  is_internal
)
SELECT 
  id,
  '0478a7d7-9d59-40bf-954e-657fa28fe251',
  'Cleaned up failed order - no Zinc order ID found, marking as permanently failed',
  'cleanup',
  true
FROM public.orders 
WHERE status = 'failed' 
  AND zinc_order_id IS NULL 
  AND updated_at = (SELECT MAX(updated_at) FROM public.orders WHERE status = 'failed' AND zinc_order_id IS NULL);