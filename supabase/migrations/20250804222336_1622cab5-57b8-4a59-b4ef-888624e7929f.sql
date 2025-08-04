-- Add address verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN address_verified boolean DEFAULT false,
ADD COLUMN address_verification_method text DEFAULT 'profile_setup',
ADD COLUMN address_verified_at timestamp with time zone DEFAULT now(),
ADD COLUMN address_last_updated timestamp with time zone DEFAULT now();

-- Create trigger to update address_last_updated when shipping_address changes
CREATE OR REPLACE FUNCTION update_address_timestamp()
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_address_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_address_timestamp();

-- Set initial verification for existing profiles with addresses
UPDATE public.profiles 
SET address_verified = true,
    address_verification_method = 'profile_setup',
    address_verified_at = created_at
WHERE shipping_address IS NOT NULL 
  AND shipping_address != '{}'::jsonb;