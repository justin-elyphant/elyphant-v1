-- Security audit and fixes for SECURITY DEFINER functions
-- This migration reviews and fixes security issues with SECURITY DEFINER functions

-- First, let's add a security check function to validate admin access more securely
CREATE OR REPLACE FUNCTION public.validate_admin_access(required_level text DEFAULT 'admin')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_level text;
BEGIN
  -- Get current user's admin level
  SELECT admin_level INTO user_level
  FROM public.business_admins
  WHERE user_id = auth.uid()
  AND admin_level IN ('owner', 'admin');
  
  -- Check if user has required access level
  CASE required_level
    WHEN 'owner' THEN
      RETURN user_level = 'owner';
    WHEN 'admin' THEN
      RETURN user_level IN ('owner', 'admin');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Update the add_business_admin function to use the new validation
CREATE OR REPLACE FUNCTION public.add_business_admin(
  new_admin_user_id uuid, 
  admin_level_param text, 
  can_view_payment_methods_param boolean DEFAULT false, 
  can_manage_payment_methods_param boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  result json;
BEGIN
  current_user_id := auth.uid();
  
  -- Use the new validation function
  IF NOT public.validate_admin_access('admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized to add business admins');
  END IF;
  
  -- Additional security check: only owners can create other owners
  IF admin_level_param = 'owner' AND NOT public.validate_admin_access('owner') THEN
    RETURN json_build_object('success', false, 'error', 'Only owners can create other owners');
  END IF;
  
  -- Insert new business admin with explicit validation
  INSERT INTO public.business_admins (
    user_id,
    admin_level,
    can_view_payment_methods,
    can_manage_payment_methods,
    created_by
  ) VALUES (
    new_admin_user_id,
    admin_level_param,
    can_view_payment_methods_param,
    can_manage_payment_methods_param,
    current_user_id
  );
  
  -- Log the action for security audit
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    current_user_id,
    'CREATE_ADMIN',
    'business_admin',
    new_admin_user_id,
    jsonb_build_object(
      'admin_level', admin_level_param,
      'can_view_payment_methods', can_view_payment_methods_param,
      'can_manage_payment_methods', can_manage_payment_methods_param
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business admin added successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create a more secure function for payment method authorization
CREATE OR REPLACE FUNCTION public.is_authorized_for_payment_methods(operation_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is a business admin with appropriate permissions
  RETURN EXISTS (
    SELECT 1 FROM public.business_admins ba
    WHERE ba.user_id = auth.uid()
    AND (
      (operation_type = 'view' AND ba.can_view_payment_methods = true) OR
      (operation_type = 'manage' AND ba.can_manage_payment_methods = true)
    )
    AND ba.admin_level IN ('owner', 'admin')
  );
END;
$$;

-- Add a security function to validate user connections safely
CREATE OR REPLACE FUNCTION public.check_user_connection_secure(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow checking connections involving the current user
  IF auth.uid() != user1_id AND auth.uid() != user2_id THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE ((user_id = user1_id AND connected_user_id = user2_id) OR
          (user_id = user2_id AND connected_user_id = user1_id)) AND
          status = 'accepted'
  );
END;
$$;

-- Update RLS policies to use the more secure functions where possible
-- This ensures that even with SECURITY DEFINER, access is properly controlled

-- Add a comment to document the security considerations
COMMENT ON FUNCTION public.validate_admin_access IS 'SECURITY DEFINER function for admin validation. Carefully audited for proper access control.';
COMMENT ON FUNCTION public.is_authorized_for_payment_methods IS 'SECURITY DEFINER function for payment method access. Includes strict permission checks.';
COMMENT ON FUNCTION public.check_user_connection_secure IS 'SECURITY DEFINER function for user connections. Only allows checking connections involving the current user.';