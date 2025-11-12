-- Fix: Allow address verification to persist when explicitly provided during address updates
-- This enables the onboarding flow to set verified addresses in one operation

CREATE OR REPLACE FUNCTION public.update_address_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if shipping_address content actually changed
  IF OLD.shipping_address IS DISTINCT FROM NEW.shipping_address THEN
    NEW.address_last_updated = now();
    
    -- Check if verification is being explicitly set in this update
    -- If NEW.address_verified = true with a valid method, it means the app is
    -- verifying the address at the same time it's being set (onboarding case)
    IF NEW.address_verified = true AND 
       NEW.address_verification_method IN ('automatic', 'user_confirmed', 'manual') THEN
      -- Allow the verification to persist (onboarding or manual verification)
      -- Don't reset - keep the values provided in the UPDATE
      RAISE NOTICE 'Allowing address verification to persist: method=%', NEW.address_verification_method;
    ELSE
      -- Reset verification status when address changes without explicit verification
      -- This prevents stale verifications when users edit addresses in settings
      NEW.address_verified = false;
      NEW.address_verification_method = 'pending_verification';
      RAISE NOTICE 'Resetting address verification due to address change';
    END IF;
    
  ELSE
    -- Address didn't change, preserve existing verification state
    NEW.address_last_updated = OLD.address_last_updated;
    
    -- Only preserve old verification values if we're not explicitly updating them
    IF NEW.address_verified = OLD.address_verified AND 
       NEW.address_verification_method = OLD.address_verification_method THEN
      -- No verification fields are being updated, keep existing values
      NEW.address_verified = OLD.address_verified;
      NEW.address_verification_method = OLD.address_verification_method;
    END IF;
    -- If verification fields are being explicitly updated, let them through
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Verify the trigger is still attached
DROP TRIGGER IF EXISTS profiles_address_update_trigger ON public.profiles;

CREATE TRIGGER profiles_address_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_address_timestamp();

COMMENT ON FUNCTION public.update_address_timestamp() IS 
'Updates address timestamp and manages verification status. 
Allows verification to persist when explicitly set during address updates (onboarding).
Resets verification when address changes without explicit verification (prevents stale data).';