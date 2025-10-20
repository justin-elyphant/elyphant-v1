-- Populate city and state from existing shipping_address data
UPDATE public.profiles
SET 
  city = shipping_address->>'city',
  state = shipping_address->>'state'
WHERE 
  shipping_address IS NOT NULL 
  AND shipping_address->>'city' IS NOT NULL
  AND (city IS NULL OR state IS NULL);

-- Create trigger function to automatically sync city and state from shipping_address
CREATE OR REPLACE FUNCTION public.sync_address_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract city and state from shipping_address JSONB
  IF NEW.shipping_address IS NOT NULL THEN
    NEW.city := NEW.shipping_address->>'city';
    NEW.state := NEW.shipping_address->>'state';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync address fields on insert or update
DROP TRIGGER IF EXISTS sync_address_on_update ON public.profiles;
CREATE TRIGGER sync_address_on_update
  BEFORE INSERT OR UPDATE OF shipping_address ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_address_fields();