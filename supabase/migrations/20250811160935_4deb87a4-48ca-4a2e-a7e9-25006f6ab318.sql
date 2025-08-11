-- Complete fixing remaining functions with search_path security
-- Fix the final remaining functions that need SET search_path TO ''

-- Fix function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  user_email TEXT;
  user_avatar TEXT;
  full_name TEXT;
  generated_username TEXT;
  existing_profile_count INTEGER;
BEGIN
  -- Check if profile already exists (to avoid overwriting enhanced profile data)
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.profiles
  WHERE id = NEW.id;
  
  -- If profile already exists, don't overwrite it
  IF existing_profile_count > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Extract email
  user_email := COALESCE(NEW.email, '');
  
  -- Extract names from OAuth metadata with better fallbacks
  user_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), ' ', 1),
    SPLIT_PART(user_email, '@', 1),
    'User'
  );
  
  user_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'family_name',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') LIKE '% %' 
      THEN TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')) + 1))
      ELSE 'Name'
    END
  );
  
  -- Extract avatar URL from OAuth providers (Google, Apple, etc.)
  user_avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'profile_image_url',
    NEW.raw_user_meta_data ->> 'photo'
  );
  
  -- Create full name for backward compatibility
  full_name := TRIM(user_first_name || ' ' || user_last_name);
  
  -- Generate unique username
  generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 6) || '_' || FLOOR(RANDOM() * 1000);
  END LOOP;
  
  -- Insert profile with extracted OAuth data and defaults for required fields
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    name, 
    email, 
    username,
    profile_image,
    birth_year,
    data_sharing_settings
  )
  VALUES (
    NEW.id, 
    user_first_name,
    user_last_name,
    full_name,
    user_email,
    generated_username,
    user_avatar,
    EXTRACT(YEAR FROM NOW()) - 25, -- Default age 25
    jsonb_build_object(
      'dob', 'friends',
      'shipping_address', 'private', 
      'gift_preferences', 'public',
      'email', 'private'
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Fix function: get_upcoming_auto_gift_events  
CREATE OR REPLACE FUNCTION public.get_upcoming_auto_gift_events(days_ahead integer DEFAULT 7)
 RETURNS TABLE(event_id uuid, rule_id uuid, user_id uuid, event_date date, event_type text, recipient_id uuid, budget_limit numeric, notification_days integer[])
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
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