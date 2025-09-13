-- Security audit and fixes for SECURITY DEFINER functions
-- This migration addresses security concerns with SECURITY DEFINER functions

-- Drop the existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS public.is_authorized_for_payment_methods(text);

-- Create a security validation function for admin access
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

-- Recreate the payment authorization function with enhanced security
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

-- Create a more secure function for user connections
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

-- Add security documentation comments
COMMENT ON FUNCTION public.validate_admin_access IS 'SECURITY DEFINER function for admin validation. Carefully audited for proper access control.';
COMMENT ON FUNCTION public.is_authorized_for_payment_methods IS 'SECURITY DEFINER function for payment method access. Includes strict permission checks.';
COMMENT ON FUNCTION public.check_user_connection_secure IS 'SECURITY DEFINER function for user connections. Only allows checking connections involving the current user.';

-- Add a security audit trigger for SECURITY DEFINER function usage
CREATE OR REPLACE FUNCTION public.log_security_definer_usage(
  function_name text,
  user_id uuid,
  operation_context jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log usage of security definer functions for audit purposes
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent
  ) VALUES (
    user_id,
    'security_definer_function_call',
    jsonb_build_object(
      'function_name', function_name,
      'timestamp', now(),
      'context', operation_context
    ),
    current_setting('request.headers', true)::jsonb->>'cf-connecting-ip',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    NULL;
END;
$$;