-- Phase 3: Auto-assign customer role to new users

-- Create function to auto-assign customer role on profile creation
CREATE OR REPLACE FUNCTION public.assign_default_customer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign customer role to new user (if they don't already have it)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign customer role when profile is created
CREATE TRIGGER on_profile_created_assign_customer_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_customer_role();

COMMENT ON FUNCTION public.assign_default_customer_role IS 'Automatically assigns customer role to new users when their profile is created';