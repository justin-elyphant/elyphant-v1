-- Fix link_pending_auto_gift_rules trigger to set relationship_type
CREATE OR REPLACE FUNCTION link_pending_auto_gift_rules()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update any pending invitation connections to accepted when user signs up
  UPDATE user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'accepted',
    relationship_type = 'friend',
    pending_recipient_email = NULL,
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND status = 'pending_invitation'
    AND connected_user_id IS NULL;

  -- Create reciprocal connection for the newly accepted invitation
  INSERT INTO user_connections (
    user_id,
    connected_user_id,
    status,
    relationship_type,
    accepted_at,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    user_id,
    'accepted',
    'friend',
    NOW(),
    NOW(),
    NOW()
  FROM user_connections
  WHERE 
    connected_user_id = NEW.id
    AND status = 'accepted'
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;

  -- Update auto_gifting_rules to link recipient_id for accepted invitations
  UPDATE auto_gifting_rules
  SET 
    recipient_id = NEW.id,
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND recipient_id IS NULL;

  RETURN NEW;
END;
$$;