-- CRITICAL SECURITY FIX: Secure zma_accounts table from public exposure
-- This table contains sensitive business API keys and must be completely locked down

-- Drop the extremely dangerous existing policy that allows public access
DROP POLICY IF EXISTS "Service role can manage ZMA accounts" ON public.zma_accounts;

-- Create secure function to check if user can access ZMA accounts
CREATE OR REPLACE FUNCTION public.can_access_zma_accounts(action_type text)
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
  
  -- Check specific permissions based on action type and admin level
  CASE action_type
    WHEN 'view' THEN
      -- Only owners and admins can view API keys
      RETURN admin_record.admin_level IN ('owner', 'admin');
    WHEN 'manage' THEN
      -- Only owners can manage API keys (create/update/delete)
      RETURN admin_record.admin_level = 'owner';
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- ULTRA-SECURE POLICIES FOR ZMA_ACCOUNTS TABLE

-- Policy 1: Service role can manage all ZMA accounts (for automated systems)
CREATE POLICY "Service role can manage ZMA accounts"
ON public.zma_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Only business owners and admins can view ZMA accounts
CREATE POLICY "Business owners can view ZMA accounts"
ON public.zma_accounts
FOR SELECT
TO authenticated
USING (public.can_access_zma_accounts('view') = true);

-- Policy 3: Only business owners can manage ZMA accounts
CREATE POLICY "Business owners can manage ZMA accounts"
ON public.zma_accounts
FOR ALL
TO authenticated
USING (public.can_access_zma_accounts('manage') = true)
WITH CHECK (public.can_access_zma_accounts('manage') = true);

-- Ensure RLS is enabled
ALTER TABLE public.zma_accounts ENABLE ROW LEVEL SECURITY;

-- Completely revoke dangerous public access
REVOKE ALL ON public.zma_accounts FROM public;
REVOKE ALL ON public.zma_accounts FROM anon;

-- Grant minimal necessary permissions to authenticated users
GRANT SELECT ON public.zma_accounts TO authenticated;
GRANT INSERT ON public.zma_accounts TO authenticated;
GRANT UPDATE ON public.zma_accounts TO authenticated;

-- Grant full access to service role for automated operations
GRANT ALL ON public.zma_accounts TO service_role;

-- Create audit function for ZMA account access
CREATE OR REPLACE FUNCTION public.audit_zma_account_access()
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
  
  -- Critical audit logging for API key access
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || '_ZMA_ACCOUNT',
    'zma_account',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'admin_level', COALESCE(admin_level, 'service_role'),
      'user_id', current_user_id,
      'account_name', COALESCE(NEW.account_name, OLD.account_name),
      'is_default', COALESCE(NEW.is_default, OLD.is_default),
      'api_key_modified', CASE WHEN TG_OP = 'UPDATE' THEN (NEW.api_key IS DISTINCT FROM OLD.api_key) ELSE false END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to audit all ZMA account operations
CREATE TRIGGER audit_zma_accounts_access
  AFTER INSERT OR UPDATE OR DELETE ON public.zma_accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_zma_account_access();

-- Create function to safely retrieve ZMA account without exposing API key
CREATE OR REPLACE FUNCTION public.get_zma_account_safe(account_id uuid)
RETURNS TABLE(
  id uuid,
  account_name text,
  account_balance numeric,
  account_status text,
  last_balance_check timestamptz,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz,
  has_api_key boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user can view ZMA accounts
  IF NOT public.can_access_zma_accounts('view') THEN
    RAISE EXCEPTION 'Unauthorized access to ZMA accounts';
  END IF;
  
  RETURN QUERY
  SELECT 
    za.id,
    za.account_name,
    za.account_balance,
    za.account_status,
    za.last_balance_check,
    za.is_default,
    za.created_at,
    za.updated_at,
    (za.api_key IS NOT NULL) as has_api_key
  FROM public.zma_accounts za
  WHERE za.id = account_id;
END;
$$;