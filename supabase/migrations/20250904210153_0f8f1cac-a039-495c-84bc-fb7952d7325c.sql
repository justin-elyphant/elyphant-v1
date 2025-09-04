-- Step 4: Clean up existing orders to use ZMA method only
-- Update any orders that have null or 'zinc_api' order_method to use 'zma'
UPDATE public.orders 
SET order_method = 'zma', updated_at = now()
WHERE order_method IS NULL OR order_method = 'zinc_api';

-- Add a default constraint to ensure new orders use ZMA
ALTER TABLE public.orders 
ALTER COLUMN order_method SET DEFAULT 'zma';

-- Create a function to log any attempts to use zinc_api
CREATE OR REPLACE FUNCTION public.log_zinc_api_attempt()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;