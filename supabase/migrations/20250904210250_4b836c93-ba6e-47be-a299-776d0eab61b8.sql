-- Fix the security warning for the log_zinc_api_attempt function
DROP FUNCTION IF EXISTS public.log_zinc_api_attempt();

CREATE OR REPLACE FUNCTION public.log_zinc_api_attempt()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when someone tries to set order_method to zinc_api
  IF NEW.order_method = 'zinc_api' THEN
    -- Convert to ZMA and log
    NEW.order_method = 'zma';
    
    -- Insert a log entry (you can modify this to use your preferred logging table)
    INSERT INTO public.order_notes (
      order_id,
      note_content,
      note_type,
      is_internal,
      admin_user_id
    ) VALUES (
      NEW.id,
      'Order method automatically converted from zinc_api to zma (zinc_api disabled)',
      'system_conversion',
      true,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
    
    RAISE NOTICE 'Order % converted from zinc_api to zma', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger to enforce ZMA-only orders
CREATE OR REPLACE TRIGGER prevent_zinc_api_orders
  BEFORE INSERT OR UPDATE OF order_method ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_zinc_api_attempt();