-- URGENT: Remove the dangerous public access policy that was missed

-- Remove the critical security vulnerability 
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Also remove any other overly permissive policies
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Verify we only have secure policies remaining
-- The remaining policies should be:
-- 1. Users can view their own profile
-- 2. Users can update their own profile  
-- 3. Users can insert their own profile
-- 4. Connected users can view basic profile info (through secure function)
-- 5. Business admins can view profiles (with audit logging)

-- Add additional protection: ensure RLS is enabled
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Create a final verification query
CREATE OR REPLACE FUNCTION public.emergency_security_verification()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  dangerous_policies integer;
  total_policies integer;
  policy_details jsonb;
BEGIN
  -- Count dangerous policies (those that allow public access)
  SELECT COUNT(*) INTO dangerous_policies
  FROM pg_policies 
  WHERE tablename = 'profiles' 
  AND schemaname = 'public'
  AND (qual = 'true' OR qual IS NULL OR policyname ILIKE '%public%' OR policyname ILIKE '%everyone%');
  
  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'profiles' AND schemaname = 'public';
  
  -- Get policy details
  SELECT jsonb_agg(
    jsonb_build_object(
      'policy_name', policyname,
      'command', cmd,
      'qualifier', COALESCE(qual, 'NO_QUALIFIER'),
      'safe', CASE 
        WHEN qual = 'true' OR qual IS NULL THEN false
        WHEN policyname ILIKE '%public%' OR policyname ILIKE '%everyone%' THEN false
        ELSE true
      END
    )
  ) INTO policy_details
  FROM pg_policies 
  WHERE tablename = 'profiles' AND schemaname = 'public';
  
  RETURN jsonb_build_object(
    'emergency_status', CASE WHEN dangerous_policies = 0 THEN 'SECURE' ELSE 'VULNERABLE' END,
    'dangerous_policies_count', dangerous_policies,
    'total_policies_count', total_policies,
    'policy_details', policy_details,
    'verification_time', now(),
    'critical_vulnerability_fixed', dangerous_policies = 0
  );
END;
$function$;