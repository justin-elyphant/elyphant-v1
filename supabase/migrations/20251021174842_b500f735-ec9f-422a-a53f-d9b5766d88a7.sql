-- Drop existing trigger if it exists (safe operation)
DROP TRIGGER IF EXISTS trigger_connection_request_email ON user_connections;

-- Recreate trigger for connection request emails (on INSERT)
CREATE TRIGGER trigger_connection_request_email
AFTER INSERT ON user_connections
FOR EACH ROW
EXECUTE FUNCTION queue_connection_request_email();

-- Create function for connection accepted emails (on UPDATE)
CREATE OR REPLACE FUNCTION queue_connection_accepted_emails()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  recipient_profile RECORD;
BEGIN
  -- Only send emails when status changes from pending to accepted
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    
    -- Get sender profile (person who sent original request)
    SELECT name, email INTO sender_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get recipient profile (person who accepted)
    SELECT name, email INTO recipient_profile
    FROM profiles WHERE id = NEW.connected_user_id;
    
    -- Skip if either email is missing
    IF sender_profile.email IS NULL OR recipient_profile.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Queue "connection accepted" email to sender
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      scheduled_for,
      status,
      attempts,
      max_attempts,
      template_variables
    ) VALUES (
      sender_profile.email,
      COALESCE(sender_profile.name, 'there'),
      NOW(),
      'pending',
      0,
      3,
      jsonb_build_object(
        'eventType', 'connection_accepted',
        'connection_id', NEW.id,
        'acceptor_name', COALESCE(recipient_profile.name, 'Someone'),
        'sender_name', COALESCE(sender_profile.name, 'there'),
        'acceptor_profile_url', 'https://elyphant.ai/profile/' || NEW.connected_user_id
      )
    );
    
    -- Queue "connection welcome" email to recipient (person who accepted)
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      scheduled_for,
      status,
      attempts,
      max_attempts,
      template_variables
    ) VALUES (
      recipient_profile.email,
      COALESCE(recipient_profile.name, 'there'),
      NOW(),
      'pending',
      0,
      3,
      jsonb_build_object(
        'eventType', 'connection_welcome',
        'connection_id', NEW.id,
        'new_connection_name', COALESCE(sender_profile.name, 'Someone'),
        'recipient_name', COALESCE(recipient_profile.name, 'there'),
        'connections_url', 'https://elyphant.ai/connections'
      )
    );
    
    RAISE NOTICE 'Connection accepted emails queued for % and %', sender_profile.email, recipient_profile.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_connection_accepted_emails ON user_connections;

-- Create trigger for connection accepted emails
CREATE TRIGGER trigger_connection_accepted_emails
AFTER UPDATE ON user_connections
FOR EACH ROW
EXECUTE FUNCTION queue_connection_accepted_emails();