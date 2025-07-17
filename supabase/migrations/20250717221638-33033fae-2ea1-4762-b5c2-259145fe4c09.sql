-- Insert the user's Solana Beach address into user_addresses
INSERT INTO public.user_addresses (
  id,
  user_id,
  name,
  address,
  is_default
) VALUES (
  gen_random_uuid(),
  auth.uid(),
  'Home',
  jsonb_build_object(
    'street', '309 N Solana Hills Dr',
    'address_line2', '#723',
    'city', 'Solana Beach',
    'state', 'CA',
    'zipCode', '92075',
    'country', 'United States'
  ),
  true
);

-- Update any other addresses for this user to not be default
UPDATE public.user_addresses 
SET is_default = false 
WHERE user_id = auth.uid() 
AND id != (SELECT id FROM public.user_addresses WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);