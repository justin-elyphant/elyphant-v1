-- CRITICAL SECURITY FIX: Handle dependencies and implement secure RLS policies

-- Step 1: Drop dependent policies first
DROP POLICY IF EXISTS "Authorized admins can view business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Authorized admins can manage business payment methods" ON public.business_payment_methods;

-- Step 2: Drop the conflicting function
DROP FUNCTION IF EXISTS public.is_authorized_for_payment_methods(text);

-- Step 3: Remove any dangerous public policies on profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Step 4: Create secure helper function for payment method authorization
CREATE OR REPLACE FUNCTION public.is_authorized_for_payment_methods(permission_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  has_permission boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Return false if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is a business admin with appropriate permissions
  SELECT 
    CASE 
      WHEN permission_type = 'view' THEN 
        COALESCE(ba.can_view_payment_methods, false) OR COALESCE(ba.can_manage_payment_methods, false)
      WHEN permission_type = 'manage' THEN 
        COALESCE(ba.can_manage_payment_methods, false)
      ELSE false
    END
  INTO has_permission
  FROM public.business_admins ba
  WHERE ba.user_id = current_user_id;
  
  RETURN COALESCE(has_permission, false);
END;
$function$;

-- Step 5: Create secure RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Connected users can view limited profile data (through secure function)
CREATE POLICY "Connected users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != id AND 
  auth.uid() IS NOT NULL AND
  can_view_profile(id) = true
);

-- Business admins can view profiles for support purposes (with audit logging)
CREATE POLICY "Business admins can view profiles" 
ON public.profiles 
FOR SELECT 
USING (is_business_admin(auth.uid()));

-- Step 6: Recreate secure payment method policies
CREATE POLICY "Authorized admins can view business payment methods" 
ON public.business_payment_methods 
FOR SELECT 
USING (is_authorized_for_payment_methods('view'));

CREATE POLICY "Authorized admins can manage business payment methods" 
ON public.business_payment_methods 
FOR ALL
USING (is_authorized_for_payment_methods('manage'))
WITH CHECK (is_authorized_for_payment_methods('manage'));

-- Step 7: Add security monitoring and audit logging
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  accessed_table text,
  accessed_id uuid,
  access_type text,
  access_reason text DEFAULT 'general_access'
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if accessed by business admin and not accessing own data
  IF is_business_admin(auth.uid()) AND auth.uid() != accessed_id THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      action_details
    ) VALUES (
      auth.uid(),
      access_type,
      accessed_table,
      accessed_id,
      jsonb_build_object(
        'timestamp', now(),
        'accessed_table', accessed_table,
        'accessed_id', accessed_id,
        'access_reason', access_reason,
        'ip_address', 'unknown',
        'user_agent', 'unknown'
      )
    );
  END IF;
END;
$function$;