-- Fix the current order to have proper scheduling data
UPDATE public.orders 
SET 
  scheduled_delivery_date = '2025-09-24',
  status = 'scheduled',
  is_gift = true,
  is_surprise_gift = false,
  updated_at = now()
WHERE id = '3565b880-5f0b-4849-9c5d-8bb8487e1f5b';

-- Add comprehensive logging for debugging future scheduling issues
INSERT INTO public.order_notes (
  order_id,
  note_content,
  note_type,
  is_internal,
  created_at
) VALUES (
  '3565b880-5f0b-4849-9c5d-8bb8487e1f5b',
  'Order corrected: Set as scheduled delivery for 2025-09-24, marked as gift. Fixed data flow issue where scheduling information was lost during order creation.',
  'system_correction',
  true,
  now()
);