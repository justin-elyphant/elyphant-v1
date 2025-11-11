-- Fix connection_established email trigger to handle invitation signups
-- The trigger needs to fire for both 'pending' -> 'accepted' AND 'pending_invitation' -> 'accepted'

CREATE OR REPLACE FUNCTION queue_connection_established_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status is changing to 'accepted' from either 'pending' or 'pending_invitation'
  IF (TG_OP = 'UPDATE' AND OLD.status IN ('pending', 'pending_invitation') AND NEW.status = 'accepted') THEN
    
    -- Queue email for the user who initiated the connection
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      template_id,
      template_variables,
      event_type,
      priority,
      scheduled_for
    )
    SELECT 
      p1.email,
      p1.full_name,
      NULL,
      jsonb_build_object(
        'recipientName', p1.full_name,
        'connectedUserName', p2.full_name,
        'connectionType', NEW.relationship_type
      ),
      'connection_established',
      'normal',
      NOW()
    FROM profiles p1
    JOIN profiles p2 ON p2.id = NEW.connected_user_id
    WHERE p1.id = NEW.user_id;

    -- Queue email for the connected user
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      template_id,
      template_variables,
      event_type,
      priority,
      scheduled_for
    )
    SELECT 
      p2.email,
      p2.full_name,
      NULL,
      jsonb_build_object(
        'recipientName', p2.full_name,
        'connectedUserName', p1.full_name,
        'connectionType', NEW.relationship_type
      ),
      'connection_established',
      'normal',
      NOW()
    FROM profiles p1
    JOIN profiles p2 ON p2.id = NEW.connected_user_id
    WHERE p1.id = NEW.user_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_connection_established ON user_connections;
CREATE TRIGGER on_connection_established
  AFTER UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION queue_connection_established_emails();