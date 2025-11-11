-- Fix the queue_connection_established_emails trigger to use correct column name
-- The profiles table has 'name' column, not 'full_name'

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
      p1.name,
      NULL,
      jsonb_build_object(
        'recipientName', p1.name,
        'connectedUserName', p2.name,
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
      p2.name,
      NULL,
      jsonb_build_object(
        'recipientName', p2.name,
        'connectedUserName', p1.name,
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