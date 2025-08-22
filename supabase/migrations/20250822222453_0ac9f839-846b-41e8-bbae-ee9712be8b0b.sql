-- Clean up business_admins and add domain restriction functions

-- Remove any existing non-@elyphant.com admin entries (if any exist)
-- Note: This is a safety measure - we'll keep the existing admin for now

-- Create function to check if email is elyphant domain
CREATE OR REPLACE FUNCTION public.is_elyphant_domain(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN email_address ILIKE '%@elyphant.com';
END;
$$;

-- Create function to automatically add elyphant domain users as business admins
CREATE OR REPLACE FUNCTION public.auto_assign_elyphant_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only add if it's an elyphant.com email
  IF public.is_elyphant_domain(NEW.email) THEN
    INSERT INTO public.business_admins (
      user_id,
      admin_level,
      can_view_payment_methods,
      can_manage_payment_methods,
      created_by
    ) VALUES (
      NEW.id,
      'admin',
      true,
      true,
      NEW.id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin privileges to elyphant.com users
CREATE TRIGGER auto_assign_elyphant_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_elyphant_admin();

-- Create function to validate trunkline access
CREATE OR REPLACE FUNCTION public.can_access_trunkline(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email text;
  is_business_admin boolean;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Check if user has elyphant.com email
  IF NOT public.is_elyphant_domain(user_email) THEN
    RETURN false;
  END IF;
  
  -- Check if user is in business_admins table
  SELECT EXISTS (
    SELECT 1 FROM public.business_admins
    WHERE user_id = user_uuid
  ) INTO is_business_admin;
  
  RETURN is_business_admin;
END;
$$;