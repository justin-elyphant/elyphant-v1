-- Fix Security Definer View issue by removing SECURITY DEFINER from table-returning functions
-- that don't actually need elevated privileges

-- The get_nudge_summary function doesn't need SECURITY DEFINER since it only accesses
-- the user's own nudge data (RLS will properly filter by user_id)
CREATE OR REPLACE FUNCTION public.get_nudge_summary(p_user_id uuid, p_recipient_email text)
RETURNS TABLE(total_nudges integer, last_nudge_sent timestamp with time zone, can_nudge boolean, days_until_next_nudge integer)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  nudge_count INTEGER;
  last_nudge TIMESTAMP WITH TIME ZONE;
  can_send BOOLEAN;
  days_until INTEGER;
BEGIN
  -- Ensure user can only access their own nudge data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot access other user''s nudge data';
  END IF;
  
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

-- The get_upcoming_auto_gift_events function doesn't need SECURITY DEFINER since it only 
-- accesses data that belongs to the authenticated user (RLS will filter properly)
CREATE OR REPLACE FUNCTION public.get_upcoming_auto_gift_events(days_ahead integer DEFAULT 7)
RETURNS TABLE(event_id uuid, rule_id uuid, user_id uuid, event_date date, event_type text, recipient_id uuid, budget_limit numeric, notification_days integer[])
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  -- Calendar-based events (birthdays, anniversaries, etc.)
  SELECT 
    usd.id as event_id,
    agr.id as rule_id,
    usd.user_id,
    usd.date::date as event_date,
    usd.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(agr.notification_preferences->'days_before'))::integer[],
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
  )
  -- RLS will automatically filter to only show data for the authenticated user

  UNION ALL

  -- Scheduled "just_because" and other events with specific dates
  SELECT 
    gen_random_uuid() as event_id,
    agr.id as rule_id,
    agr.user_id,
    agr.scheduled_date as event_date,
    agr.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(agr.notification_preferences->'days_before'))::integer[],
      ARRAY[7, 3, 1]
    ) as notification_days
  FROM public.auto_gifting_rules agr
  WHERE agr.is_active = true
    AND agr.scheduled_date IS NOT NULL
    AND agr.scheduled_date::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
    -- Only include if no execution on the scheduled date
    AND NOT EXISTS (
      SELECT 1 FROM public.automated_gift_executions age 
      WHERE age.rule_id = agr.id 
      AND age.execution_date = agr.scheduled_date
      AND age.status IN ('completed', 'processing', 'pending')
    )

  UNION ALL

  -- Immediate "just_because" events without scheduled dates
  SELECT 
    gen_random_uuid() as event_id,
    agr.id as rule_id,
    agr.user_id,
    CURRENT_DATE as event_date,
    agr.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(agr.notification_preferences->'days_before'))::integer[],
      ARRAY[0] -- No advance notification for immediate gifts
    ) as notification_days
  FROM public.auto_gifting_rules agr
  WHERE agr.date_type = 'just_because'
    AND agr.is_active = true
    AND agr.scheduled_date IS NULL -- Only unscheduled "just_because" events
    -- Only include if no execution in the last 24 hours to prevent spam
    AND NOT EXISTS (
      SELECT 1 FROM public.automated_gift_executions age 
      WHERE age.rule_id = agr.id 
      AND age.execution_date >= (CURRENT_DATE - INTERVAL '1 day')
      AND age.status IN ('completed', 'processing', 'pending')
    );
$function$;