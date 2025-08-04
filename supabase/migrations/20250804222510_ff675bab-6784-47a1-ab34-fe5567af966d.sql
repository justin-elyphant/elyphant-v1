-- Fix the security warning by recreating the function with proper search_path
DROP TRIGGER profiles_address_update_trigger ON public.profiles;
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

-- Recreate the trigger
CREATE TRIGGER profiles_address_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_address_timestamp();