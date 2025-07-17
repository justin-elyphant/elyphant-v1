UPDATE public.user_addresses 
SET name = 'Justin Meeks', 
    address = jsonb_set(
      address, 
      '{state}', 
      '"CA"'
    )
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email = 'justin@elyphant.com'
) 
AND is_default = true;