-- Update ZMA accounts table with correct Zinc API key
UPDATE public.zma_accounts 
SET api_key = '64F912256D6C5B44F545F941',
    updated_at = now()
WHERE api_key = '5B394AAF6CD03728E9E33DDF';

-- Update API keys table with correct Zinc API key for consistency
UPDATE public.api_keys 
SET key = '64F912256D6C5B44F545F941'
WHERE key = '5B394AAF6CD03728E9E33DDF';

-- Add debug logging to track API key usage
INSERT INTO public.admin_audit_log (
  admin_user_id,
  action_type,
  target_type,
  target_id,
  action_details
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'ZINC_API_KEY_UPDATE',
  'system_maintenance',
  gen_random_uuid(),
  jsonb_build_object(
    'timestamp', now(),
    'old_key_prefix', '5B394AAF6CD0',
    'new_key_prefix', '64F912256D6C',
    'reason', 'API key mismatch fix',
    'affected_tables', ARRAY['zma_accounts', 'api_keys']
  )
);