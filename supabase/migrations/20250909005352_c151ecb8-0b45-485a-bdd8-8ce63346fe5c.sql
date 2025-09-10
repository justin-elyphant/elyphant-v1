-- Drop existing function and recreate with enhanced security
DROP FUNCTION IF EXISTS public.is_authorized_for_payment_methods(text);

-- Create audit logging function for business payment methods
CREATE OR REPLACE FUNCTION public.log_business_payment_access(
  operation_type text,
  user_id_param uuid,
  payment_method_id uuid DEFAULT NULL,
  additional_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    user_id_param,
    operation_type,
    'business_payment_method',
    payment_method_id,
    jsonb_build_object(
      'operation', operation_type,
      'timestamp', now(),
      'additional_data', additional_data
    ),
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If audit logging fails, log to server logs but don't fail the operation
    RAISE WARNING 'Failed to log business payment access: %', SQLERRM;
END;
$$;

-- Create enhanced authorization function for payment methods
CREATE OR REPLACE FUNCTION public.is_authorized_for_payment_methods(action_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  user_admin_level text;
  has_view_permission boolean := false;
  has_manage_permission boolean := false;
BEGIN
  -- Get user's admin level and permissions
  SELECT 
    ba.admin_level,
    ba.can_view_payment_methods,
    ba.can_manage_payment_methods
  INTO 
    user_admin_level,
    has_view_permission,
    has_manage_permission
  FROM public.business_admins ba
  WHERE ba.user_id = auth.uid();
  
  -- If no record found, user is not authorized
  IF user_admin_level IS NULL THEN
    -- Log unauthorized access attempt
    BEGIN
      PERFORM public.log_business_payment_access(
        'unauthorized_access_attempt',
        auth.uid(),
        NULL,
        jsonb_build_object('action_type', action_type, 'reason', 'not_business_admin')
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Continue even if logging fails
        NULL;
    END;
    RETURN false;
  END IF;
  
  -- Check permissions based on action type
  CASE action_type
    WHEN 'view' THEN
      IF has_view_permission OR user_admin_level IN ('owner', 'admin') THEN
        RETURN true;
      END IF;
    WHEN 'manage' THEN
      IF has_manage_permission OR user_admin_level IN ('owner', 'admin') THEN
        RETURN true;
      END IF;
    ELSE
      -- Unknown action type
      BEGIN
        PERFORM public.log_business_payment_access(
          'invalid_action_type',
          auth.uid(),
          NULL,
          jsonb_build_object('action_type', action_type)
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RETURN false;
  END CASE;
  
  -- Log denied access
  BEGIN
    PERFORM public.log_business_payment_access(
      'access_denied',
      auth.uid(),
      NULL,
      jsonb_build_object('action_type', action_type, 'admin_level', user_admin_level)
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  RETURN false;
END;
$$;

-- Create audit trigger function for business payment methods
CREATE OR REPLACE FUNCTION public.audit_business_payment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Log the operation
  CASE TG_OP
    WHEN 'INSERT' THEN
      BEGIN
        PERFORM public.log_business_payment_access(
          'payment_method_created',
          auth.uid(),
          NEW.id,
          jsonb_build_object('name', NEW.name, 'card_type', NEW.card_type, 'last_four', NEW.last_four)
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RETURN NEW;
    WHEN 'UPDATE' THEN
      BEGIN
        PERFORM public.log_business_payment_access(
          'payment_method_updated',
          auth.uid(),
          NEW.id,
          jsonb_build_object(
            'old_name', OLD.name,
            'new_name', NEW.name,
            'is_default_changed', (OLD.is_default != NEW.is_default),
            'is_active_changed', (OLD.is_active != NEW.is_active)
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RETURN NEW;
    WHEN 'DELETE' THEN
      BEGIN
        PERFORM public.log_business_payment_access(
          'payment_method_deleted',
          auth.uid(),
          OLD.id,
          jsonb_build_object('name', OLD.name, 'card_type', OLD.card_type)
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      RETURN OLD;
  END CASE;
  
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_business_payment_access_trigger ON public.business_payment_methods;

-- Create audit trigger for business payment methods
CREATE TRIGGER audit_business_payment_access_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.business_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_business_payment_access();

-- Update RLS policies for business_payment_methods to be more restrictive
DROP POLICY IF EXISTS "Authorized admins can manage business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Authorized admins can view business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Service role can manage business payment methods" ON public.business_payment_methods;

-- Create new, more restrictive RLS policies
CREATE POLICY "Authorized view access only"
  ON public.business_payment_methods
  FOR SELECT
  TO authenticated
  USING (
    public.is_authorized_for_payment_methods('view')
  );

CREATE POLICY "Authorized insert access only"
  ON public.business_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_authorized_for_payment_methods('manage')
  );

CREATE POLICY "Authorized update access only"
  ON public.business_payment_methods
  FOR UPDATE
  TO authenticated
  USING (
    public.is_authorized_for_payment_methods('manage')
  )
  WITH CHECK (
    public.is_authorized_for_payment_methods('manage')
  );

CREATE POLICY "Authorized delete access only"
  ON public.business_payment_methods
  FOR DELETE
  TO authenticated
  USING (
    public.is_authorized_for_payment_methods('manage')
  );

-- Service role policy (for edge functions)
CREATE POLICY "Service role full access"
  ON public.business_payment_methods
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.business_payment_methods ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized_for_payment_methods(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_business_payment_access(text, uuid, uuid, jsonb) TO authenticated;