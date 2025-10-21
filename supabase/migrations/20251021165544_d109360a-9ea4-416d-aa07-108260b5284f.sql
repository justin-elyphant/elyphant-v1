-- Phase 2: Database Triggers for Automated Connection Emails

-- Function to queue connection request email when a pending connection is created
CREATE OR REPLACE FUNCTION queue_connection_request_email()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  recipient_profile RECORD;
BEGIN
  -- Only send email for pending status on INSERT
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    
    -- Get sender profile
    SELECT name, email INTO sender_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get recipient profile  
    SELECT name, email INTO recipient_profile
    FROM profiles WHERE id = NEW.connected_user_id;
    
    -- Skip if either profile is missing or email is missing
    IF sender_profile.email IS NULL OR recipient_profile.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Queue connection invitation email to recipient
    INSERT INTO email_queue (
      event_type,
      recipient_email,
      scheduled_for,
      priority,
      metadata
    ) VALUES (
      'connection_invitation',
      recipient_profile.email,
      NOW(),
      'high',
      jsonb_build_object(
        'connection_id', NEW.id,
        'sender_name', COALESCE(sender_profile.name, 'Someone'),
        'recipient_name', COALESCE(recipient_profile.name, 'there'),
        'sender_email', sender_profile.email
      )
    );
    
    RAISE NOTICE 'Queued connection invitation email for connection %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for connection request emails
DROP TRIGGER IF EXISTS trigger_connection_request_email ON user_connections;
CREATE TRIGGER trigger_connection_request_email
AFTER INSERT ON user_connections
FOR EACH ROW
EXECUTE FUNCTION queue_connection_request_email();

-- Function to queue connection accepted emails when status changes to accepted
CREATE OR REPLACE FUNCTION queue_connection_accepted_emails()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  recipient_profile RECORD;
BEGIN
  -- Only send emails when status changes to 'accepted'
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    
    -- Get sender profile (person who sent original request)
    SELECT name, email INTO sender_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get recipient profile (person who accepted)
    SELECT name, email INTO recipient_profile
    FROM profiles WHERE id = NEW.connected_user_id;
    
    -- Skip if either profile is missing or email is missing
    IF sender_profile.email IS NULL OR recipient_profile.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Queue "connection accepted" email to sender
    INSERT INTO email_queue (
      event_type,
      recipient_email,
      scheduled_for,
      priority,
      metadata
    ) VALUES (
      'connection_accepted',
      sender_profile.email,
      NOW(),
      'high',
      jsonb_build_object(
        'connection_id', NEW.id,
        'acceptor_name', COALESCE(recipient_profile.name, 'Your connection'),
        'sender_name', COALESCE(sender_profile.name, 'there')
      )
    );
    
    -- Queue "welcome connected" email to recipient
    INSERT INTO email_queue (
      event_type,
      recipient_email,
      scheduled_for,
      priority,
      metadata
    ) VALUES (
      'connection_welcome',
      recipient_profile.email,
      NOW(),
      'high',
      jsonb_build_object(
        'connection_id', NEW.id,
        'new_connection_name', COALESCE(sender_profile.name, 'Your new connection'),
        'recipient_name', COALESCE(recipient_profile.name, 'there')
      )
    );
    
    RAISE NOTICE 'Queued connection accepted emails for connection %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for connection acceptance emails
DROP TRIGGER IF EXISTS trigger_connection_accepted_emails ON user_connections;
CREATE TRIGGER trigger_connection_accepted_emails
AFTER UPDATE ON user_connections
FOR EACH ROW
EXECUTE FUNCTION queue_connection_accepted_emails();