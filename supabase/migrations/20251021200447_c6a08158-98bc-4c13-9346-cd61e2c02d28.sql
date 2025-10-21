-- Fix: Stop auto-accept of pending connections and add gift context fields

-- Step 1: Update link_pending_auto_gift_rules to keep status as 'pending' instead of 'accepted'
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
    
  -- Update user_connections to link the connected user but keep as PENDING
  UPDATE user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'pending',  -- ✅ Changed from 'accepted' to 'pending'
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND status = 'pending_invitation';
    
  -- Create reciprocal connection record for incoming requests
  INSERT INTO user_connections (
    user_id,
    connected_user_id,
    status,
    relationship_type,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,  -- New user (recipient)
    user_id,  -- Original sender
    'pending',  -- Mark as pending incoming request
    'friend',
    NOW(),
    NOW()
  FROM user_connections
  WHERE connected_user_id = NEW.id
    AND status = 'pending'
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
    'pending_rules_auto_linked',
    jsonb_build_object(
      'recipient_id', NEW.id,
      'recipient_email', NEW.email,
      'linked_rules_count', COUNT(*)
    ),
    jsonb_build_object(
      'trigger', 'profile_creation',
      'timestamp', NOW(),
      'status_kept_pending', true
    )
  FROM auto_gifting_rules
  WHERE recipient_id = NEW.id
  GROUP BY user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add gift context fields to user_connections table
ALTER TABLE user_connections 
ADD COLUMN IF NOT EXISTS has_pending_gift BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_occasion TEXT,
ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Step 3: Update existing connections with gift context
UPDATE user_connections uc
SET 
  has_pending_gift = TRUE,
  gift_occasion = agr.date_type,
  gift_message = agr.gift_preferences->>'custom_message'
FROM auto_gifting_rules agr
WHERE (
  (agr.recipient_id = uc.connected_user_id AND agr.user_id = uc.user_id)
  OR (agr.pending_recipient_email = uc.pending_recipient_email AND agr.user_id = uc.user_id)
)
AND uc.status IN ('pending', 'pending_invitation');

-- Step 4: Fix Charles's existing connection (update the specific records)
-- Change Justin's connection to Charles from 'accepted' to 'pending'
UPDATE user_connections
SET 
  status = 'pending',
  updated_at = NOW()
WHERE id = '82622382-f3cf-4cf1-825e-c36ad6d7743c'
  AND status = 'accepted';

-- Ensure reciprocal connection exists for Charles to see Justin in pending
UPDATE user_connections
SET 
  status = 'pending',
  updated_at = NOW()
WHERE id = 'd573b9e0-65c7-4edc-9d0a-93f8ffe9dd90'
  AND status = 'accepted';

-- Step 5: Update queue_connection_request_email to detect gift context
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
          'signup_url', 'https://elyphant.ai/auth?invite=' || NEW.id::text
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