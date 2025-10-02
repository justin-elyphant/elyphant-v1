-- Phase 1: Database Trigger for Auto-Linking Pending Auto-Gift Rules

-- Function to automatically link pending auto-gift rules when user signs up
CREATE OR REPLACE FUNCTION link_pending_auto_gift_rules()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Update auto_gifting_rules matching the new user's email
  UPDATE auto_gifting_rules
  SET 
    recipient_id = NEW.id,
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND recipient_id IS NULL;
    
  -- Update user_connections to link the connected user
  UPDATE user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'accepted',
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND status = 'pending_invitation';
    
  -- Log the auto-linking event
  INSERT INTO auto_gift_event_logs (
    user_id,
    event_type,
    event_data,
    metadata
  )
  SELECT 
    user_id,
    'pending_rules_auto_linked',
    jsonb_build_object(
      'recipient_id', NEW.id,
      'recipient_email', NEW.email,
      'linked_rules_count', COUNT(*)
    ),
    jsonb_build_object(
      'trigger', 'profile_creation',
      'timestamp', NOW()
    )
  FROM auto_gifting_rules
  WHERE recipient_id = NEW.id
  GROUP BY user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
CREATE TRIGGER trigger_link_pending_auto_gift_rules
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_pending_auto_gift_rules();

-- Phase 3: Create RPC function for manual linking (backup/auth flow)
CREATE OR REPLACE FUNCTION link_pending_rules_manual(
  p_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  linked_count integer := 0;
BEGIN
  -- Update auto_gifting_rules
  UPDATE auto_gifting_rules
  SET 
    recipient_id = p_user_id,
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    pending_recipient_email = p_email
    AND recipient_id IS NULL;
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  -- Log manual linking event
  IF linked_count > 0 THEN
    INSERT INTO auto_gift_event_logs (
      user_id,
      event_type,
      event_data,
      metadata
    )
    SELECT 
      user_id,
      'pending_rules_manually_linked',
      jsonb_build_object(
        'recipient_id', p_user_id,
        'recipient_email', p_email,
        'linked_rules_count', linked_count
      ),
      jsonb_build_object(
        'trigger', 'manual_auth_flow',
        'timestamp', NOW()
      )
    FROM auto_gifting_rules
    WHERE recipient_id = p_user_id
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'linked_count', linked_count
  );
END;
$$;