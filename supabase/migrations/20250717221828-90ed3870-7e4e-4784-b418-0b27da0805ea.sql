WITH user_profile AS (
  SELECT id FROM public.profiles 
  WHERE email = 'justin@elyphant.com'
  LIMIT 1
)
INSERT INTO public.user_addresses (
  id,
  user_id,
  name,
  address,
  is_default
) 
SELECT
  gen_random_uuid(),
  id,
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
FROM user_profile
RETURNING *;

-- Update any other addresses to not be default
UPDATE public.user_addresses 
SET is_default = false 
WHERE id NOT IN (
  SELECT id FROM public.user_addresses 
  ORDER BY created_at DESC 
  LIMIT 1
);