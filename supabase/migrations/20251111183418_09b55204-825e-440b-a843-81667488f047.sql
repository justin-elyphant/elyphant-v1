-- Fix search_path security warning for queue_connection_established_emails function

CREATE OR REPLACE FUNCTION queue_connection_established_emails()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user1_profile RECORD;
  v_user2_profile RECORD;
BEGIN
  -- Only fire for one direction of the connection to prevent duplicates
  -- Use UUID comparison to ensure we only process once per connection pair
  IF NEW.user_id > NEW.connected_user_id THEN
    RETURN NEW;
  END IF;

  -- Only queue emails when connection is accepted from pending or pending_invitation
  IF OLD.status IN ('pending', 'pending_invitation') AND NEW.status = 'accepted' THEN
    
    -- Get both users' profile information
    SELECT id, name, email INTO v_user1_profile
    FROM profiles
    WHERE id = NEW.user_id;
    
    SELECT id, name, email INTO v_user2_profile
    FROM profiles
    WHERE id = NEW.connected_user_id;
    
    -- Queue email for user 1 (about connecting with user 2)
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      event_type,
      template_variables,
      metadata,
      scheduled_for
    ) VALUES (
      v_user1_profile.email,
      v_user1_profile.name,
      'connection_established',
      jsonb_build_object(
        'recipientName', v_user1_profile.name,
        'connection_name', v_user2_profile.name
      ),
      jsonb_build_object(
        'connection_id', NEW.id,
        'user_id', v_user1_profile.id,
        'connected_user_id', v_user2_profile.id
      ),
      NOW()
    );
    
    -- Queue email for user 2 (about connecting with user 1)
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      event_type,
      template_variables,
      metadata,
      scheduled_for
    ) VALUES (
      v_user2_profile.email,
      v_user2_profile.name,
      'connection_established',
      jsonb_build_object(
        'recipientName', v_user2_profile.name,
        'connection_name', v_user1_profile.name
      ),
      jsonb_build_object(
        'connection_id', NEW.id,
        'user_id', v_user2_profile.id,
        'connected_user_id', v_user1_profile.id
      ),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;