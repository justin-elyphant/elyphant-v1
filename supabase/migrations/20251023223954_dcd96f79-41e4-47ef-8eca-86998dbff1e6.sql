-- Trigger to auto-update auto_gifting_rules when a pending connection is accepted
-- This optimizes future executions by linking the recipient_id once they accept

CREATE OR REPLACE FUNCTION sync_auto_gift_rules_on_connection_accept()
RETURNS TRIGGER AS $$
DECLARE
  recipient_email text;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    
    -- Get the email of the connected user
    SELECT email INTO recipient_email
    FROM profiles
    WHERE id = NEW.connected_user_id;
    
    -- Update auto_gifting_rules where pending_recipient_email matches
    UPDATE auto_gifting_rules
    SET 
      recipient_id = NEW.connected_user_id,
      updated_at = now()
    WHERE 
      user_id = NEW.user_id
      AND pending_recipient_email = recipient_email
      AND recipient_id IS NULL
      AND is_active = true;
      
    -- Log the sync for debugging
    IF FOUND THEN
      RAISE NOTICE 'Auto-synced auto_gifting_rules for user % with recipient %', NEW.user_id, NEW.connected_user_id;
    END IF;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_connections table
DROP TRIGGER IF EXISTS on_connection_accepted_sync_rules ON user_connections;

CREATE TRIGGER on_connection_accepted_sync_rules
  AFTER UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION sync_auto_gift_rules_on_connection_accept();