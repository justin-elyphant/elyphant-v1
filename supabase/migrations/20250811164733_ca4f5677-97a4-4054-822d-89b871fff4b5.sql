-- ENHANCED SECURITY: Add business admin authorization layer to payment methods
-- Create a more granular security model for business payment method access

-- Create business_admins table to track who can access payment methods
CREATE TABLE IF NOT EXISTS public.business_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_level text NOT NULL CHECK (admin_level IN ('owner', 'finance_manager', 'admin')),
  can_view_payment_methods boolean DEFAULT false,
  can_manage_payment_methods boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS on business_admins table
ALTER TABLE public.business_admins ENABLE ROW LEVEL SECURITY;

-- Create policies for business_admins table
CREATE POLICY "Service role can manage business admins"
ON public.business_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Business admins can view admin list"
ON public.business_admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_admins ba 
    WHERE ba.user_id = auth.uid() AND ba.admin_level IN ('owner', 'admin')
  )
);

-- Create enhanced security function for payment method access
CREATE OR REPLACE FUNCTION public.is_authorized_for_payment_methods(action_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  admin_record public.business_admins%ROWTYPE;
BEGIN
  current_user_id := auth.uid();
  
  -- If no user is authenticated, deny access
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get admin permissions for current user
  SELECT * INTO admin_record
  FROM public.business_admins
  WHERE user_id = current_user_id;
  
  -- If user is not in business_admins table, deny access
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check specific permissions based on action type
  CASE action_type
    WHEN 'view' THEN
      RETURN admin_record.can_view_payment_methods = true;
    WHEN 'manage' THEN
      RETURN admin_record.can_manage_payment_methods = true;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Update business_payment_methods policies with enhanced authorization
-- Drop existing policies
DROP POLICY IF EXISTS "Service role can read business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Service role can insert business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Service role can update business payment methods" ON public.business_payment_methods;
DROP POLICY IF EXISTS "Service role can delete business payment methods" ON public.business_payment_methods;

-- Create new enhanced policies

-- Policy 1: Service role can manage (for automated systems)
CREATE POLICY "Service role can manage business payment methods"
ON public.business_payment_methods
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authorized business admins can view payment methods
CREATE POLICY "Authorized admins can view business payment methods"
ON public.business_payment_methods
FOR SELECT
TO authenticated
USING (public.is_authorized_for_payment_methods('view') = true);

-- Policy 3: Authorized business admins can manage payment methods
CREATE POLICY "Authorized admins can manage business payment methods"
ON public.business_payment_methods
FOR ALL
TO authenticated
USING (public.is_authorized_for_payment_methods('manage') = true)
WITH CHECK (public.is_authorized_for_payment_methods('manage') = true);

-- Create audit function for enhanced payment method access
CREATE OR REPLACE FUNCTION public.audit_business_payment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  admin_level text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get admin level for audit
  SELECT ba.admin_level INTO admin_level
  FROM public.business_admins ba
  WHERE ba.user_id = current_user_id;
  
  -- Enhanced audit logging with user context
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || '_PAYMENT_METHOD',
    'business_payment_method',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'admin_level', COALESCE(admin_level, 'service_role'),
      'user_id', current_user_id,
      'payment_method_name', COALESCE(NEW.name, OLD.name),
      'is_default', COALESCE(NEW.is_default, OLD.is_default)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the audit trigger
DROP TRIGGER IF EXISTS audit_business_payment_methods_access ON public.business_payment_methods;
CREATE TRIGGER audit_business_payment_methods_enhanced_access
  AFTER INSERT OR UPDATE OR DELETE ON public.business_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.audit_business_payment_access();

-- Insert initial business admin (you'll need to replace with actual admin user ID)
-- This is a placeholder - in production, this would be set up differently
INSERT INTO public.business_admins (
  user_id, 
  admin_level, 
  can_view_payment_methods, 
  can_manage_payment_methods,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with actual admin user ID
  'owner',
  true,
  true,
  '00000000-0000-0000-0000-000000000000'::uuid
) ON CONFLICT (user_id) DO NOTHING;