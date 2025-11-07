-- Fix connection established email trigger to use correct event type
-- This replaces the outdated connection_accepted/connection_welcome events with connection_established

CREATE OR REPLACE FUNCTION queue_connection_established_emails()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  recipient_profile RECORD;
BEGIN
  -- Only send emails when status changes from pending to accepted
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    
    -- Get sender profile (person who sent original request - the initiator)
    SELECT name, email, id INTO sender_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get recipient profile (person who accepted)
    SELECT name, email, id INTO recipient_profile
    FROM profiles WHERE id = NEW.connected_user_id;
    
    -- Skip if either email is missing
    IF sender_profile.email IS NULL OR recipient_profile.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Queue "connection_established" email to sender (initiator)
    INSERT INTO email_queue (
      event_type,
      recipient_email,
      scheduled_for,
      priority,
      metadata
    ) VALUES (
      'connection_established',
      sender_profile.email,
      NOW(),
      'normal',
      jsonb_build_object(
        'connection_id', NEW.id,
        'recipient_name', COALESCE(sender_profile.name, 'there'),
        'connection_name', COALESCE(recipient_profile.name, 'Someone'),
        'connection_profile_url', 'https://app.elyphant.ai/profile/' || recipient_profile.id,
        'is_initiator', true
      )
    );
    
    -- Queue "connection_established" email to recipient (acceptor)
    INSERT INTO email_queue (
      event_type,
      recipient_email,
      scheduled_for,
      priority,
      metadata
    ) VALUES (
      'connection_established',
      recipient_profile.email,
      NOW(),
      'normal',
      jsonb_build_object(
        'connection_id', NEW.id,
        'recipient_name', COALESCE(recipient_profile.name, 'there'),
        'connection_name', COALESCE(sender_profile.name, 'Someone'),
        'connection_profile_url', 'https://app.elyphant.ai/profile/' || sender_profile.id,
        'is_initiator', false
      )
    );
    
    RAISE NOTICE 'Connection established emails queued for % (initiator) and % (acceptor)', 
      sender_profile.email, recipient_profile.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_connection_accepted_emails ON user_connections;
DROP FUNCTION IF EXISTS queue_connection_accepted_emails();

-- Create new trigger with updated name
CREATE TRIGGER trigger_connection_established_emails
AFTER UPDATE ON user_connections
FOR EACH ROW
EXECUTE FUNCTION queue_connection_established_emails();