-- Fix the security warning for the update_address_timestamp function
DROP FUNCTION public.update_address_timestamp();

CREATE OR REPLACE FUNCTION public.update_address_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if shipping_address actually changed
  IF OLD.shipping_address IS DISTINCT FROM NEW.shipping_address THEN
    NEW.address_last_updated = now();
    -- Reset verification status when address changes
    NEW.address_verified = false;
    NEW.address_verification_method = 'pending_verification';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';