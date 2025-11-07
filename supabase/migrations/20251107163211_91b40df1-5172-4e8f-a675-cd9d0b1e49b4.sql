-- One-time backfill: Create birthday events for existing users who have DOB but no birthday event
-- This handles users who added their birthday before the trigger was created

DO $$
DECLARE
  profile_record RECORD;
  birthday_this_year date;
  birthday_date date;
  month_part text;
  day_part text;
  events_created integer := 0;
BEGIN
  -- Loop through all profiles that have DOB but no birthday event
  FOR profile_record IN 
    SELECT p.id, p.dob
    FROM public.profiles p
    WHERE p.dob IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_special_dates usd
        WHERE usd.user_id = p.id AND usd.date_type = 'birthday'
      )
  LOOP
    BEGIN
      -- Parse MM-DD format
      month_part := split_part(profile_record.dob, '-', 1);
      day_part := split_part(profile_record.dob, '-', 2);
      
      -- Calculate birthday for current year
      birthday_this_year := (EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || month_part || '-' || day_part)::date;
      
      -- If birthday already passed this year, use next year
      IF birthday_this_year < CURRENT_DATE THEN
        birthday_date := (EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '1 year')::text || '-' || month_part || '-' || day_part)::date;
      ELSE
        birthday_date := birthday_this_year;
      END IF;
      
      -- Create birthday event
      INSERT INTO public.user_special_dates (
        user_id,
        date,
        date_type,
        visibility,
        is_recurring,
        recurring_type,
        created_at
      ) VALUES (
        profile_record.id,
        birthday_date,
        'birthday',
        'shared',
        true,
        'yearly',
        now()
      );
      
      events_created := events_created + 1;
      
      RAISE NOTICE 'Created birthday event for user % with date %', profile_record.id, birthday_date;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create birthday event for user %: %', profile_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete: Created % birthday events', events_created;
END $$;