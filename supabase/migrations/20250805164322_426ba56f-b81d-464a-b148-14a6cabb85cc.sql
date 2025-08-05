-- Fix the address timestamp trigger to allow manual verification updates
CREATE OR REPLACE FUNCTION public.update_address_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only update if shipping_address content actually changed (not just a re-save of same data)
  IF OLD.shipping_address IS DISTINCT FROM NEW.shipping_address THEN
    NEW.address_last_updated = now();
    -- Reset verification status when address content changes
    NEW.address_verified = false;
    NEW.address_verification_method = 'pending_verification';
  ELSE
    -- Keep existing values if address didn't actually change
    NEW.address_last_updated = OLD.address_last_updated;
    
    -- IMPORTANT: Only preserve old verification values if we're not explicitly updating them
    -- This allows manual verification updates to work properly
    IF NEW.address_verified = OLD.address_verified AND NEW.address_verification_method = OLD.address_verification_method THEN
      -- No verification fields are being updated, keep existing values
      NEW.address_verified = OLD.address_verified;
      NEW.address_verification_method = OLD.address_verification_method;
    END IF;
    -- If verification fields are being explicitly updated, let them through
  END IF;
  RETURN NEW;
END;
$function$;