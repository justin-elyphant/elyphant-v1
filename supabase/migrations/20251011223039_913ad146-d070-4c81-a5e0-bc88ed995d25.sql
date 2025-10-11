-- Create function to safely check if a user has a valid shipping address (boolean only)
CREATE OR REPLACE FUNCTION public.has_valid_shipping_address(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  addr jsonb;
  has_valid boolean := false;
BEGIN
  SELECT shipping_address INTO addr FROM public.profiles WHERE id = target_user_id;

  IF addr IS NULL OR addr = 'null'::jsonb THEN
    RETURN false;
  END IF;

  has_valid := COALESCE(addr->>'address_line1', addr->>'street', addr->>'address1', addr->>'address') IS NOT NULL
    AND (addr->>'city') IS NOT NULL
    AND COALESCE(addr->>'state', addr->>'region', addr->>'province') IS NOT NULL
    AND COALESCE(addr->>'zip_code', addr->>'zipCode', addr->>'postal_code', addr->>'postcode') IS NOT NULL;

  RETURN has_valid;
END;
$$;

-- Create function to return a masked location (city/state/country only)
CREATE OR REPLACE FUNCTION public.get_masked_location(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  addr jsonb;
BEGIN
  SELECT shipping_address INTO addr FROM public.profiles WHERE id = target_user_id;
  IF addr IS NULL OR addr = 'null'::jsonb THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN jsonb_build_object(
    'city', COALESCE(addr->>'city',''),
    'state', COALESCE(addr->>'state', addr->>'region', addr->>'province',''),
    'country', COALESCE(addr->>'country', addr->>'country_code','US')
  );
END;
$$;