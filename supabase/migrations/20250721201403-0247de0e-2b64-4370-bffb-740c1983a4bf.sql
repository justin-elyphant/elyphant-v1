
-- Phase 1: Database Cleanup and Schema Updates

-- First, convert existing 'follow' relationships to 'friend' relationships
UPDATE user_connections 
SET relationship_type = 'friend' 
WHERE relationship_type = 'follow' AND status = 'accepted';

-- Convert pending 'follow' requests to pending 'friend' requests  
UPDATE user_connections 
SET relationship_type = 'friend'
WHERE relationship_type = 'follow' AND status = 'pending';

-- Add check constraint to prevent 'follow' relationships going forward
ALTER TABLE user_connections 
ADD CONSTRAINT check_no_follow_relationships 
CHECK (relationship_type != 'follow');

-- Update privacy settings to remove follower-related options
-- Convert 'followers_only' to 'friends' for profile_visibility
UPDATE privacy_settings 
SET profile_visibility = 'friends' 
WHERE profile_visibility = 'followers_only';

-- Remove follower/following count display settings (they'll be handled in code)
UPDATE privacy_settings 
SET show_follower_count = false, 
    show_following_count = false;

-- Update the privacy settings check constraint if it exists
ALTER TABLE privacy_settings 
DROP CONSTRAINT IF EXISTS privacy_settings_profile_visibility_check;

ALTER TABLE privacy_settings 
ADD CONSTRAINT privacy_settings_profile_visibility_check 
CHECK (profile_visibility IN ('public', 'private', 'friends'));

-- Update allow_follows_from to be more descriptive for connection requests
ALTER TABLE privacy_settings 
DROP CONSTRAINT IF EXISTS privacy_settings_allow_follows_from_check;

-- Rename the column to be more accurate
ALTER TABLE privacy_settings 
RENAME COLUMN allow_follows_from TO allow_connection_requests_from;

ALTER TABLE privacy_settings 
ADD CONSTRAINT privacy_settings_allow_connection_requests_from_check 
CHECK (allow_connection_requests_from IN ('everyone', 'friends_only', 'nobody'));

-- Update the can_user_follow function to be can_user_connect
DROP FUNCTION IF EXISTS can_user_follow(uuid, uuid);

CREATE OR REPLACE FUNCTION public.can_user_connect(requester_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_privacy_setting text;
  is_blocked boolean;
BEGIN
  -- Check if either user has blocked the other
  SELECT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = requester_id AND blocked_id = target_id) 
       OR (blocker_id = target_id AND blocked_id = requester_id)
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Check target user's privacy settings
  SELECT COALESCE(allow_connection_requests_from, 'everyone') 
  FROM privacy_settings 
  WHERE user_id = target_id 
  INTO target_privacy_setting;
  
  -- Default to 'everyone' if no settings found
  IF target_privacy_setting IS NULL THEN
    target_privacy_setting := 'everyone';
  END IF;
  
  -- Apply privacy rules
  CASE target_privacy_setting
    WHEN 'nobody' THEN
      RETURN false;
    WHEN 'friends_only' THEN
      -- Check if they're already connected as friends
      RETURN EXISTS (
        SELECT 1 FROM user_connections 
        WHERE ((user_id = requester_id AND connected_user_id = target_id) 
            OR (user_id = target_id AND connected_user_id = requester_id))
          AND status = 'accepted' 
          AND relationship_type = 'friend'
      );
    ELSE -- 'everyone'
      RETURN true;
  END CASE;
END;
$function$;
