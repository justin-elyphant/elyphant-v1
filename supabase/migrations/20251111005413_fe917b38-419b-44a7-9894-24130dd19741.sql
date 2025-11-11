-- Drop and recreate the link_pending_auto_gift_rules function with fixed logic
DROP FUNCTION IF EXISTS link_pending_auto_gift_rules() CASCADE;

CREATE OR REPLACE FUNCTION link_pending_auto_gift_rules()
RETURNS TRIGGER AS $$
DECLARE
  connection_id uuid;
  sender_id uuid;
BEGIN
  RAISE NOTICE 'link_pending_auto_gift_rules: New profile created for user_id=%, email=%', NEW.id, NEW.email;

  -- Update pending auto-gift rules
  UPDATE auto_gifting_rules
  SET 
    recipient_id = NEW.id,
    pending_recipient_email = NULL,
    updated_at = now()
  WHERE pending_recipient_email = NEW.email
    AND recipient_id IS NULL;

  RAISE NOTICE 'link_pending_auto_gift_rules: Updated % auto-gift rules', (SELECT COUNT(*) FROM auto_gifting_rules WHERE recipient_id = NEW.id);

  -- Update pending connections and capture the details using RETURNING
  UPDATE user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'accepted',
    pending_recipient_email = NULL,
    pending_recipient_name = NULL,
    accepted_at = now(),
    updated_at = now()
  WHERE pending_recipient_email = NEW.email
    AND status = 'pending_invitation'
  RETURNING id, user_id INTO connection_id, sender_id;

  RAISE NOTICE 'link_pending_auto_gift_rules: Updated connection_id=%, sender_id=%', connection_id, sender_id;

  -- Create reciprocal connection if we successfully updated a connection
  IF connection_id IS NOT NULL AND sender_id IS NOT NULL THEN
    RAISE NOTICE 'link_pending_auto_gift_rules: Creating reciprocal connection from % to %', NEW.id, sender_id;
    
    INSERT INTO user_connections (
      user_id,
      connected_user_id,
      status,
      accepted_at,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      sender_id,
      'accepted',
      now(),
      now(),
      now()
    )
    ON CONFLICT (user_id, connected_user_id) DO NOTHING;

    RAISE NOTICE 'link_pending_auto_gift_rules: Reciprocal connection created successfully';
  ELSE
    RAISE NOTICE 'link_pending_auto_gift_rules: No connection to update or reciprocal connection already exists';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_profile_created_link_pending_rules ON profiles;

CREATE TRIGGER on_profile_created_link_pending_rules
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_pending_auto_gift_rules();