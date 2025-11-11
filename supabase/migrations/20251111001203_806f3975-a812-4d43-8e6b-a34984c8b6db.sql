-- Fix invitation signup flow to auto-accept connections and send connection_established emails
-- This migration updates the triggers to:
-- 1. Auto-accept BOTH connections when someone signs up via invitation
-- 2. Fix domain URLs to use https://elyphant.ai instead of https://app.elyphant.ai

-- ============================================================
-- Step 1: Update link_pending_auto_gift_rules to auto-accept connections
-- ============================================================
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
    
  -- FOR INVITATION SIGNUPS: Auto-accept connection (changed from 'pending' to 'accepted')
  UPDATE user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'accepted',  -- ✅ Changed from 'pending' to 'accepted'
    pending_recipient_email = NULL,
    accepted_at = NOW(),  -- Track acceptance timestamp
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND status = 'pending_invitation';
    
  -- Create reciprocal ACCEPTED connection for invitation signups
  INSERT INTO user_connections (
    user_id,
    connected_user_id,
    status,
    relationship_type,
    accepted_at,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,  -- New user (recipient)
    user_id,  -- Original sender
    'accepted',  -- ✅ Auto-accept reciprocal connection
    'friend',
    NOW(),
    NOW(),
    NOW()
  FROM user_connections
  WHERE connected_user_id = NEW.id
    AND status = 'accepted'  -- Only for accepted (invitation) connections
    AND pending_recipient_email IS NULL
  ON CONFLICT DO NOTHING;
    
  -- Log the auto-linking event
  INSERT INTO auto_gift_event_logs (
    user_id,
    event_type,
    event_data,
    metadata
  )
  SELECT 
    user_id,
    'pending_rules_auto_accepted',  -- Updated event name
    jsonb_build_object(
      'recipient_id', NEW.id,
      'recipient_email', NEW.email,
      'linked_rules_count', COUNT(*)
    ),
    jsonb_build_object(
      'trigger', 'profile_creation',
      'timestamp', NOW(),
      'status_auto_accepted', true  -- Updated metadata
    )
  FROM auto_gifting_rules
  WHERE recipient_id = NEW.id
  GROUP BY user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 2: Fix domain URLs in queue_connection_established_emails
-- ============================================================
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
        'connection_profile_url', 'https://elyphant.ai/profile/' || recipient_profile.id || '?context=connection',
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
        'connection_profile_url', 'https://elyphant.ai/profile/' || sender_profile.id || '?context=connection',
        'is_initiator', false
      )
    );
    
    RAISE NOTICE 'Connection established emails queued for % (initiator) and % (acceptor)', 
      sender_profile.email, recipient_profile.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ============================================================
-- Step 3: Fix domain URLs in queue_connection_request_email
-- ============================================================
CREATE OR REPLACE FUNCTION queue_connection_request_email()
RETURNS TRIGGER AS $$
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
          'invitation_url', 'https://elyphant.ai/auth?invite=' || NEW.id::text
        )
      );
      
      RAISE NOTICE 'Queued % email for connection %', 
        CASE WHEN has_gift THEN 'gift+connection' ELSE 'connection' END,
        NEW.id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';