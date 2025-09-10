-- Fix search path security warnings for existing functions that need it
-- Note: The function we just created (can_access_vendor_portal) already has the correct search_path

-- Update has_role function to have proper search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Update is_business_admin function to have proper search path
CREATE OR REPLACE FUNCTION public.is_business_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_admins
    WHERE user_id = check_user_id 
    AND admin_level IN ('owner', 'admin')
  );
END;
$function$;

-- Update is_elyphant_domain function to have proper search path
CREATE OR REPLACE FUNCTION public.is_elyphant_domain(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN email_address ILIKE '%@elyphant.com';
END;
$function$;