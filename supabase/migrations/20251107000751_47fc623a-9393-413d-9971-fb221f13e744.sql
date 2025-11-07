-- Fix invitation URL domain in connection request email queue function
CREATE OR REPLACE FUNCTION public.queue_connection_request_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_profile RECORD;
  recipient_profile RECORD;
  has_gift BOOLEAN := FALSE;
  gift_occasion_text TEXT;
  gift_message_text TEXT;
BEGIN
  -- Only send email for pending status on INSERT
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    
    -- Get sender profile
    SELECT name, email INTO sender_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get recipient profile (may be NULL for pending invitations)
    IF NEW.connected_user_id IS NOT NULL THEN
      SELECT name, email INTO recipient_profile
      FROM profiles WHERE id = NEW.connected_user_id;
    END IF;
    
    -- Skip if sender email is missing
    IF sender_profile.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if this connection has an associated gift
    has_gift := COALESCE(NEW.has_pending_gift, FALSE);
    gift_occasion_text := NEW.gift_occasion;
    gift_message_text := NEW.gift_message;
    
    -- If no gift context on connection, check auto_gifting_rules
    IF NOT has_gift THEN
      SELECT EXISTS(
        SELECT 1 FROM auto_gifting_rules
        WHERE user_id = NEW.user_id
          AND (
            recipient_id = NEW.connected_user_id 
            OR pending_recipient_email = NEW.pending_recipient_email
          )
          AND is_active = TRUE
      ) INTO has_gift;
      
      -- Get gift details if exists
      IF has_gift THEN
        SELECT date_type, gift_preferences->>'custom_message'
        INTO gift_occasion_text, gift_message_text
        FROM auto_gifting_rules
        WHERE user_id = NEW.user_id
          AND (
            recipient_id = NEW.connected_user_id 
            OR pending_recipient_email = NEW.pending_recipient_email
          )
          AND is_active = TRUE
        LIMIT 1;
      END IF;
    END IF;
    
    -- Determine recipient email and name
    DECLARE
      target_email TEXT;
      target_name TEXT;
    BEGIN
      IF recipient_profile.email IS NOT NULL THEN
        target_email := recipient_profile.email;
        target_name := COALESCE(recipient_profile.name, 'there');
      ELSIF NEW.pending_recipient_email IS NOT NULL THEN
        target_email := NEW.pending_recipient_email;
        target_name := COALESCE(NEW.pending_recipient_name, 'there');
      ELSE
        -- No recipient email available
        RETURN NEW;
      END IF;
      
      -- Queue appropriate email based on whether there's a gift
      INSERT INTO email_queue (
        event_type,
        recipient_email,
        scheduled_for,
        priority,
        metadata
      ) VALUES (
        CASE 
          WHEN has_gift THEN 'gift_invitation_with_connection_request'
          ELSE 'connection_invitation'
        END,
        target_email,
        NOW(),
        CASE WHEN has_gift THEN 'high' ELSE 'normal' END,
        jsonb_build_object(
          'connection_id', NEW.id,
          'sender_name', COALESCE(sender_profile.name, 'Someone'),
          'sender_email', sender_profile.email,
          'recipient_name', target_name,
          'recipient_email', target_email,
          'has_gift', has_gift,
          'gift_occasion', gift_occasion_text,
          'gift_message', gift_message_text,
          'invitation_url', 'https://app.elyphant.ai/auth?invite=' || NEW.id::text
        )
      );
      
      RAISE NOTICE 'Queued % email for connection %', 
        CASE WHEN has_gift THEN 'gift+connection' ELSE 'connection' END,
        NEW.id;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;