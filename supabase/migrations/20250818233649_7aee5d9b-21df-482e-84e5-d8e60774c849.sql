-- Fix bidirectional auto-gift permission checking by updating the database function
-- This ensures both users can check auto-gift permissions regardless of who initiated the connection

DROP FUNCTION IF EXISTS public.check_auto_gift_permission(uuid, uuid);

CREATE OR REPLACE FUNCTION public.check_auto_gift_permission(p_user_id uuid, p_connection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  connection_data jsonb;
  data_status jsonb;
  missing_data text[] := '{}';
  blocked_data text[] := '{}';
  has_rules boolean := false;
  rate_limit_ok boolean := true;
  permission_status text;
  user_friendly_message text;
  connection_permissions jsonb;
BEGIN
  -- Get connection and permissions from BOTH directions (bidirectional)
  SELECT 
    to_jsonb(uc.*) as connection,
    COALESCE(uc.data_access_permissions, '{"shipping_address": true, "dob": true, "email": true}'::jsonb) as permissions
  INTO connection_data, connection_permissions
  FROM user_connections uc
  WHERE (
    (uc.user_id = p_user_id AND uc.connected_user_id = p_connection_id) OR
    (uc.user_id = p_connection_id AND uc.connected_user_id = p_user_id)
  ) AND uc.status = 'accepted'
  LIMIT 1;

  -- Check if connection exists
  IF connection_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'canAutoGift', false,
      'reasonCode', 'connection_not_found',
      'userFriendlyMessage', 'Connection not found or not accepted'
    );
  END IF;

  -- Check connection-level permissions first (these take precedence)
  IF connection_permissions->>'shipping_address' = 'false' THEN
    blocked_data := array_append(blocked_data, 'shipping');
  END IF;
  
  IF connection_permissions->>'dob' = 'false' THEN
    blocked_data := array_append(blocked_data, 'birthday');
  END IF;
  
  IF connection_permissions->>'email' = 'false' THEN
    blocked_data := array_append(blocked_data, 'email');
  END IF;

  -- If connection permissions allow, check if target user has the required data
  IF connection_permissions->>'shipping_address' != 'false' THEN
    -- Check if shipping address exists for the connection target
    IF NOT EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = p_connection_id 
      AND p.shipping_address IS NOT NULL 
      AND p.shipping_address != 'null'::jsonb
      AND p.shipping_address->>'address_line1' IS NOT NULL
    ) THEN
      missing_data := array_append(missing_data, 'shipping');
    END IF;
  END IF;

  IF connection_permissions->>'dob' != 'false' THEN
    -- Check if date of birth exists
    IF NOT EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = p_connection_id 
      AND p.dob IS NOT NULL
    ) THEN
      missing_data := array_append(missing_data, 'birthday');
    END IF;
  END IF;

  IF connection_permissions->>'email' != 'false' THEN
    -- Check if email exists
    IF NOT EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = p_connection_id 
      AND p.email IS NOT NULL
      AND p.email != ''
    ) THEN
      missing_data := array_append(missing_data, 'email');
    END IF;
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
    permission_status := 'ready';
    user_friendly_message := 'Ready to set up auto-gifting';
  ELSE
    permission_status := 'ready';
    user_friendly_message := 'Auto-gifting is active';
  END IF;

  RETURN jsonb_build_object(
    'status', permission_status,
    'canAutoGift', permission_status = 'ready',
    'reasonCode', CASE 
      WHEN permission_status = 'blocked' THEN 'data_sharing_restricted'
      WHEN permission_status = 'setup_needed' THEN 'missing_required_data'
      ELSE 'auto_gift_ready'
    END,
    'userFriendlyMessage', user_friendly_message,
    'missingData', missing_data,
    'blockedData', blocked_data,
    'hasRules', has_rules,
    'connectionPermissions', connection_permissions
  );
END;
$$;

-- Update user_connections table to have proper defaults for data_access_permissions
-- This ensures new connections have auto-gifting enabled by default
ALTER TABLE public.user_connections 
ALTER COLUMN data_access_permissions 
SET DEFAULT '{"shipping_address": true, "dob": true, "email": true}'::jsonb;

-- Update existing connections that have NULL permissions to the default
UPDATE public.user_connections 
SET data_access_permissions = '{"shipping_address": true, "dob": true, "email": true}'::jsonb
WHERE data_access_permissions IS NULL;

-- Add a constraint to ensure data_access_permissions is never NULL
ALTER TABLE public.user_connections 
ALTER COLUMN data_access_permissions SET NOT NULL;