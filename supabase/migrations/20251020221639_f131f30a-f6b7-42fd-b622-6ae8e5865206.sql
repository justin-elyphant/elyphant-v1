-- Phase 3.5b: Migrate customer records to shopper and update trigger
-- Now that the enum value exists, we can migrate the data

-- Migrate all existing 'customer' role records to 'shopper'
UPDATE public.user_roles 
SET role = 'shopper'
WHERE role = 'customer';

-- Update the auto-assignment trigger to use 'shopper' instead of 'customer'
CREATE OR REPLACE FUNCTION public.assign_default_customer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign shopper role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'shopper'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;