-- Fix search_path for the new fulfillment queue trigger function
DROP FUNCTION IF EXISTS update_fulfillment_queue_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_fulfillment_queue_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER fulfillment_queue_updated_at_trigger
  BEFORE UPDATE ON auto_gift_fulfillment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_fulfillment_queue_updated_at();