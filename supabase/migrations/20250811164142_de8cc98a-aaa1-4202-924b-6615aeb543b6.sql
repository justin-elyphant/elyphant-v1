-- CRITICAL SECURITY FIX: Secure business payment methods table
-- This table contains encrypted credit card data and must be completely locked down

-- Drop the extremely dangerous existing policy that allows public access
DROP POLICY IF EXISTS "Service role can manage business payment methods" ON public.business_payment_methods;

-- Create ultra-secure policies that only allow service role access
-- These are business-level payment methods, not user-specific, so only service role should access them

-- Policy 1: Only service role can read payment methods
CREATE POLICY "Service role can read business payment methods" 
ON public.business_payment_methods 
FOR SELECT 
TO service_role 
USING (true);

-- Policy 2: Only service role can insert payment methods
CREATE POLICY "Service role can insert business payment methods" 
ON public.business_payment_methods 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Policy 3: Only service role can update payment methods
CREATE POLICY "Service role can update business payment methods" 
ON public.business_payment_methods 
FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 4: Only service role can delete payment methods
CREATE POLICY "Service role can delete business payment methods" 
ON public.business_payment_methods 
FOR DELETE 
TO service_role 
USING (true);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.business_payment_methods ENABLE ROW LEVEL SECURITY;

-- Completely revoke ALL access from ALL other roles
REVOKE ALL ON public.business_payment_methods FROM public;
REVOKE ALL ON public.business_payment_methods FROM authenticated;
REVOKE ALL ON public.business_payment_methods FROM anon;

-- Grant access ONLY to service_role
GRANT ALL ON public.business_payment_methods TO service_role;

-- Add additional security: Create audit function for payment method access
CREATE OR REPLACE FUNCTION public.audit_payment_method_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log any access to payment methods in admin audit log
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'business_payment_method',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'table', 'business_payment_methods'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to audit all payment method operations
CREATE TRIGGER audit_business_payment_methods_access
  AFTER INSERT OR UPDATE OR DELETE ON public.business_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_method_access();