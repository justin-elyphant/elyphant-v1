-- Update order 1b2de6e6-ddff-4c1c-8581-1ee04a5b2705 with Justin's correct Solana Beach address
UPDATE public.orders 
SET shipping_address = jsonb_build_object(
  'address_line1', '309 N Solana Hills Dr',
  'address_line2', '#723',
  'city', 'San Diego',
  'state', 'California', 
  'zip_code', '92075',
  'country', 'US'
),
updated_at = now()
WHERE id = '1b2de6e6-ddff-4c1c-8581-1ee04a5b2705';