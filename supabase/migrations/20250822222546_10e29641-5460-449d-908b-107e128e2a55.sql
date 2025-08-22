-- Fix function search path security issues by setting proper search paths

-- Update the trigger function to have proper search path
CREATE OR REPLACE FUNCTION public.auto_assign_elyphant_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update the domain check function to have proper search path
CREATE OR REPLACE FUNCTION public.is_elyphant_domain(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN email_address ILIKE '%@elyphant.com';
END;
$$;

-- Update the access validation function to have proper search path
CREATE OR REPLACE FUNCTION public.can_access_trunkline(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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