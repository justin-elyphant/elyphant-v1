-- Continue fixing remaining functions with search_path security
-- Fix all remaining functions that lack SET search_path TO ''

-- Fix function: can_user_connect
CREATE OR REPLACE FUNCTION public.can_user_connect(requester_id uuid, target_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_privacy_setting text;
  is_blocked boolean;
BEGIN
  -- Check if either user has blocked the other
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (blocker_id = requester_id AND blocked_id = target_id) 
       OR (blocker_id = target_id AND blocked_id = requester_id)
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Check target user's privacy settings
  SELECT COALESCE(allow_connection_requests_from, 'everyone') 
  FROM public.privacy_settings 
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
        SELECT 1 FROM public.user_connections 
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

-- Fix function: can_send_nudge
CREATE OR REPLACE FUNCTION public.can_send_nudge(p_user_id uuid, p_recipient_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total_nudges INTEGER;
  last_nudge_date TIMESTAMP WITH TIME ZONE;
  days_since_last_nudge INTEGER;
BEGIN
  -- Get total nudges and last nudge date for this recipient
  SELECT 
    COUNT(*),
    MAX(last_nudge_sent_at)
  INTO total_nudges, last_nudge_date
  FROM public.connection_nudges
  WHERE user_id = p_user_id AND recipient_email = p_recipient_email;
  
  -- If no nudges sent yet, allow
  IF total_nudges = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if max nudges (3) reached
  IF total_nudges >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if at least 7 days have passed since last nudge
  days_since_last_nudge := EXTRACT(DAY FROM (NOW() - last_nudge_date));
  IF days_since_last_nudge < 7 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fix function: get_nudge_summary
CREATE OR REPLACE FUNCTION public.get_nudge_summary(p_user_id uuid, p_recipient_email text)
 RETURNS TABLE(total_nudges integer, last_nudge_sent timestamp with time zone, can_nudge boolean, days_until_next_nudge integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  nudge_count INTEGER;
  last_nudge TIMESTAMP WITH TIME ZONE;
  can_send BOOLEAN;
  days_until INTEGER;
BEGIN
  -- Get nudge statistics
  SELECT 
    COUNT(*),
    MAX(last_nudge_sent_at)
  INTO nudge_count, last_nudge
  FROM public.connection_nudges
  WHERE user_id = p_user_id AND recipient_email = p_recipient_email;
  
  -- Check if can send nudge
  can_send := public.can_send_nudge(p_user_id, p_recipient_email);
  
  -- Calculate days until next nudge is allowed
  IF last_nudge IS NOT NULL THEN
    days_until := GREATEST(0, 7 - EXTRACT(DAY FROM (NOW() - last_nudge)));
  ELSE
    days_until := 0;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(nudge_count, 0),
    last_nudge,
    can_send,
    days_until::INTEGER;
END;
$function$;

-- Fix function: is_group_admin
CREATE OR REPLACE FUNCTION public.is_group_admin(group_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id 
    AND role = 'admin'
  );
END;
$function$;

-- Fix function: is_group_member
CREATE OR REPLACE FUNCTION public.is_group_member(group_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id
  );
END;
$function$;

-- Fix function: can_cancel_order
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  order_status text;
  order_zinc_status text;
BEGIN
  SELECT o.status, o.zinc_status INTO order_status, order_zinc_status
  FROM public.orders o
  WHERE o.id = order_id AND o.user_id = auth.uid();
  
  -- Can't cancel if order doesn't exist or doesn't belong to user
  IF order_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Can cancel if status is pending, processing, or failed
  -- Cannot cancel if already shipped, delivered, or cancelled
  RETURN order_status IN ('pending', 'processing', 'failed') 
    AND COALESCE(order_zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled');
END;
$function$;