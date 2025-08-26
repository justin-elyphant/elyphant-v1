-- Enhanced trigger logic for different event types
-- Update get_upcoming_auto_gift_events to handle both calendar and "just_because" events

CREATE OR REPLACE FUNCTION public.get_upcoming_auto_gift_events(days_ahead integer DEFAULT 7)
 RETURNS TABLE(event_id uuid, rule_id uuid, user_id uuid, event_date date, event_type text, recipient_id uuid, budget_limit numeric, notification_days integer[])
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  -- Calendar-based events (existing logic)
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
  )

  UNION ALL

  -- "Just Because" events (new logic for immediate/daily triggering)
  SELECT 
    gen_random_uuid() as event_id, -- Generate a synthetic event ID
    agr.id as rule_id,
    agr.user_id,
    CURRENT_DATE as event_date, -- Use current date for immediate processing
    agr.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      (agr.notification_preferences->>'days_before')::integer[],
      ARRAY[0] -- No advance notification for "just because"
    ) as notification_days
  FROM public.auto_gifting_rules agr
  WHERE agr.date_type = 'just_because'
    AND agr.is_active = true
    -- Only include if no execution in the last 24 hours to prevent spam
    AND NOT EXISTS (
      SELECT 1 FROM public.automated_gift_executions age 
      WHERE age.rule_id = agr.id 
      AND age.execution_date >= (CURRENT_DATE - INTERVAL '1 day')
      AND age.status IN ('completed', 'processing', 'pending')
    );
$function$