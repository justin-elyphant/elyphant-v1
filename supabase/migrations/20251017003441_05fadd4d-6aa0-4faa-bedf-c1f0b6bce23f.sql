-- Create privacy-safe function to fetch full shipping address for gifting
CREATE OR REPLACE FUNCTION public.get_full_shipping_address_for_gifting(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  addr jsonb;
BEGIN
  -- Fetch full address from profile
  SELECT shipping_address INTO addr 
  FROM public.profiles 
  WHERE id = target_user_id;
  
  -- Return full address if available
  IF addr IS NOT NULL AND addr != 'null'::jsonb THEN
    RETURN addr;
  END IF;
  
  -- Fallback: check user_addresses table
  SELECT jsonb_build_object(
    'address_line1', address_line1,
    'address_line2', address_line2,
    'city', city,
    'state', state,
    'zip_code', zip_code,
    'country', country
  ) INTO addr
  FROM public.user_addresses
  WHERE user_id = target_user_id
    AND is_default = true
  LIMIT 1;
  
  RETURN COALESCE(addr, '{}'::jsonb);
END;
$$;