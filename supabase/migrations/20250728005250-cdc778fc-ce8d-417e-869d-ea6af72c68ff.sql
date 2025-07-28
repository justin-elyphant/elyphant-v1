-- Final batch of security hardening: Fix remaining database functions
-- Adding SET search_path = '' to prevent schema injection attacks

-- Update remaining functions that still need search path security
CREATE OR REPLACE FUNCTION public.get_upcoming_auto_gift_events(days_ahead integer DEFAULT 7)
RETURNS TABLE(event_id uuid, rule_id uuid, user_id uuid, event_date date, event_type text, recipient_id uuid, budget_limit numeric, notification_days integer[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    usd.id as event_id,
    agr.id as rule_id,
    usd.user_id,
    usd.date::date as event_date,
    usd.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      (agr.notification_preferences->>'days_before')::integer[],
      ARRAY[7, 3, 1]
    ) as notification_days
  FROM public.user_special_dates usd
  JOIN public.auto_gifting_rules agr ON (
    agr.user_id = usd.user_id 
    AND agr.date_type = usd.date_type
    AND agr.is_active = true
  )
  WHERE usd.date::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
  AND NOT EXISTS (
    SELECT 1 FROM public.automated_gift_executions age 
    WHERE age.event_id = usd.id 
    AND age.rule_id = agr.id 
    AND age.execution_date = usd.date::date
    AND age.status IN ('completed', 'processing')
  );
$function$;

-- Update can_user_connect function
CREATE OR REPLACE FUNCTION public.can_user_connect(requester_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Update update_gift_proposal_votes_updated_at function
CREATE OR REPLACE FUNCTION public.update_gift_proposal_votes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_auto_gifting_rules_updated_at function
CREATE OR REPLACE FUNCTION public.update_auto_gifting_rules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update get_nudge_summary function
CREATE OR REPLACE FUNCTION public.get_nudge_summary(p_user_id uuid, p_recipient_email text)
RETURNS TABLE(total_nudges integer, last_nudge_sent timestamp with time zone, can_nudge boolean, days_until_next_nudge integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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