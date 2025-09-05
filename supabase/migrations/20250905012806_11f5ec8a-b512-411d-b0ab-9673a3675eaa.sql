-- Fix the verification function to properly check INSERT policies

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
  -- Count dangerous policies (those that allow unrestricted public access)
  -- For INSERT policies, check with_check; for others, check qual
  SELECT COUNT(*) INTO dangerous_policies
  FROM pg_policies 
  WHERE tablename = 'profiles' 
  AND schemaname = 'public'
  AND (
    -- Dangerous SELECT/UPDATE/DELETE policies
    (cmd != 'INSERT' AND (qual = 'true' OR policyname ILIKE '%public%' OR policyname ILIKE '%everyone%'))
    OR
    -- Dangerous INSERT policies (no with_check constraint)
    (cmd = 'INSERT' AND with_check IS NULL)
  );
  
  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'profiles' AND schemaname = 'public';
  
  -- Get policy details
  SELECT jsonb_agg(
    jsonb_build_object(
      'policy_name', policyname,
      'command', cmd,
      'using_qualifier', COALESCE(qual, 'NONE'),
      'with_check_qualifier', COALESCE(with_check, 'NONE'),
      'safe', CASE 
        WHEN cmd != 'INSERT' AND (qual = 'true' OR policyname ILIKE '%public%' OR policyname ILIKE '%everyone%') THEN false
        WHEN cmd = 'INSERT' AND with_check IS NULL THEN false
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
    'critical_vulnerability_fixed', dangerous_policies = 0,
    'explanation', 'INSERT policies use with_check, others use qual/using clause'
  );
END;
$function$;

-- Run final verification
SELECT emergency_security_verification() as comprehensive_security_check;