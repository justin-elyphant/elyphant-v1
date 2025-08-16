-- Create function to efficiently check auto-gift permissions
CREATE OR REPLACE FUNCTION public.check_auto_gift_permission(
  p_user_id uuid,
  p_connection_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  connection_data jsonb;
  data_status jsonb;
  missing_data text[] := '{}';
  blocked_data text[] := '{}';
  has_rules boolean := false;
  rate_limit_ok boolean := true;
  permission_status text;
  user_friendly_message text;
BEGIN
  -- Get connection and data status
  SELECT 
    to_jsonb(uc.*) as connection,
    jsonb_build_object(
      'shipping', COALESCE(p.data_sharing_settings->>'shipping_address', 'missing'),
      'birthday', COALESCE(p.data_sharing_settings->>'dob', 'missing'),
      'email', COALESCE(p.data_sharing_settings->>'email', 'missing')
    ) as data_status
  INTO connection_data, data_status
  FROM user_connections uc
  LEFT JOIN profiles p ON p.id = uc.connected_user_id
  WHERE uc.user_id = p_user_id 
    AND uc.connected_user_id = p_connection_id
    AND uc.status = 'accepted';

  -- Check if connection exists
  IF connection_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'canAutoGift', false,
      'reasonCode', 'connection_not_found',
      'userFriendlyMessage', 'Connection not found or not accepted'
    );
  END IF;

  -- Check for missing data
  IF data_status->>'shipping' = 'missing' THEN
    missing_data := array_append(missing_data, 'shipping');
  END IF;
  
  IF data_status->>'birthday' = 'missing' THEN
    missing_data := array_append(missing_data, 'birthday');
  END IF;
  
  IF data_status->>'email' = 'missing' THEN
    missing_data := array_append(missing_data, 'email');
  END IF;

  -- Check for blocked data
  IF data_status->>'shipping' = 'blocked' THEN
    blocked_data := array_append(blocked_data, 'shipping');
  END IF;
  
  IF data_status->>'birthday' = 'blocked' THEN
    blocked_data := array_append(blocked_data, 'birthday');
  END IF;
  
  IF data_status->>'email' = 'blocked' THEN
    blocked_data := array_append(blocked_data, 'email');
  END IF;

  -- Check for active auto-gifting rules
  SELECT EXISTS (
    SELECT 1 FROM auto_gifting_rules
    WHERE user_id = p_user_id 
      AND recipient_id = p_connection_id
      AND is_active = true
  ) INTO has_rules;

  -- Determine permission status
  IF array_length(blocked_data, 1) > 0 THEN
    permission_status := 'blocked';
    user_friendly_message := 'Data sharing has been restricted';
  ELSIF array_length(missing_data, 1) > 0 AND ('shipping' = ANY(missing_data) OR 'birthday' = ANY(missing_data)) THEN
    permission_status := 'setup_needed';
    user_friendly_message := 'Request missing data for auto-gifting';
  ELSIF NOT has_rules THEN
    permission_status := 'setup_needed';
    user_friendly_message := 'Set up auto-gifting rules';
  ELSE
    permission_status := 'ready';
    user_friendly_message := 'Auto-gifting is ready';
  END IF;

  -- Return comprehensive permission result
  RETURN jsonb_build_object(
    'status', permission_status,
    'canAutoGift', permission_status = 'ready',
    'missingData', missing_data,
    'blockedData', blocked_data,
    'hasActiveRules', has_rules,
    'withinRateLimits', rate_limit_ok,
    'reasonCode', CASE 
      WHEN permission_status = 'blocked' THEN 'data_blocked'
      WHEN permission_status = 'setup_needed' AND NOT has_rules THEN 'no_rules_configured'
      WHEN permission_status = 'setup_needed' THEN 'missing_required_data'
      ELSE 'auto_gift_ready'
    END,
    'userFriendlyMessage', user_friendly_message
  );
END;
$function$;