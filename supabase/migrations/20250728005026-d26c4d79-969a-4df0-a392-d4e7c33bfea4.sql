-- Continue security hardening: Fix remaining database functions
-- Adding SET search_path = '' to prevent schema injection attacks

-- Update update_popularity_scores function
CREATE OR REPLACE FUNCTION public.update_popularity_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Update popularity score when new analytics data is added
  INSERT INTO public.popularity_scores (product_id, customer_score, engagement_score)
  VALUES (NEW.product_id, 1, CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END)
  ON CONFLICT (product_id) DO UPDATE SET
    customer_score = public.popularity_scores.customer_score + 1,
    engagement_score = public.popularity_scores.engagement_score + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- Update update_analytics_updated_at function
CREATE OR REPLACE FUNCTION public.update_analytics_updated_at()
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

-- Update check_message_rate_limit function
CREATE OR REPLACE FUNCTION public.check_message_rate_limit(sender_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  daily_limit INTEGER := 500; -- 500 messages per day
  minute_limit INTEGER := 10; -- 10 messages per minute
  current_count INTEGER;
  last_minute_count INTEGER;
  is_limited BOOLEAN := false;
BEGIN
  -- Insert or update rate limit record
  INSERT INTO public.message_rate_limits (user_id, messages_sent_today, last_message_date, last_message_time)
  VALUES (sender_uuid, 1, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    messages_sent_today = CASE 
      WHEN public.message_rate_limits.last_message_date < CURRENT_DATE THEN 1
      ELSE public.message_rate_limits.messages_sent_today + 1
    END,
    last_message_date = CURRENT_DATE,
    last_message_time = NOW();

  -- Check daily limit
  SELECT messages_sent_today INTO current_count
  FROM public.message_rate_limits
  WHERE user_id = sender_uuid;

  -- Check minute limit
  SELECT COUNT(*) INTO last_minute_count
  FROM public.messages
  WHERE sender_id = sender_uuid 
  AND created_at > NOW() - INTERVAL '1 minute';

  -- Apply rate limiting
  IF current_count > daily_limit OR last_minute_count >= minute_limit THEN
    UPDATE public.message_rate_limits 
    SET is_rate_limited = true,
        rate_limit_expires_at = CASE 
          WHEN last_minute_count >= minute_limit THEN NOW() + INTERVAL '1 minute'
          ELSE NOW() + INTERVAL '1 day'
        END
    WHERE user_id = sender_uuid;
    is_limited := true;
  END IF;

  RETURN NOT is_limited;
END;
$function$;

-- Update can_send_nudge function
CREATE OR REPLACE FUNCTION public.can_send_nudge(p_user_id uuid, p_recipient_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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