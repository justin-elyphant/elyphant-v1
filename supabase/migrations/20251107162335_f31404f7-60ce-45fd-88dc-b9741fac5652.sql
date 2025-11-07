-- Auto-create birthday events when users add their DOB
-- This enables auto-gifting rules to match birthday events automatically

-- Function to automatically create birthday event when DOB is added/updated
CREATE OR REPLACE FUNCTION public.auto_create_birthday_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  birthday_this_year date;
  birthday_date date;
  month_part text;
  day_part text;
BEGIN
  -- Only proceed if DOB is being added/updated and is not null
  IF NEW.dob IS NOT NULL AND (OLD.dob IS NULL OR OLD.dob IS DISTINCT FROM NEW.dob) THEN
    
    -- Check if birthday event already exists for this user
    IF NOT EXISTS (
      SELECT 1 FROM public.user_special_dates
      WHERE user_id = NEW.id AND date_type = 'birthday'
    ) THEN
      
      -- Parse MM-DD format from dob field
      -- NEW.dob is stored as 'MM-DD' format in text
      month_part := split_part(NEW.dob, '-', 1);
      day_part := split_part(NEW.dob, '-', 2);
      
      -- Calculate birthday for current year
      birthday_this_year := (EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || month_part || '-' || day_part)::date;
      
      -- If birthday already passed this year, use next year
      IF birthday_this_year < CURRENT_DATE THEN
        birthday_date := (EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '1 year')::text || '-' || month_part || '-' || day_part)::date;
      ELSE
        birthday_date := birthday_this_year;
      END IF;
      
      -- Create birthday event in user_special_dates
      INSERT INTO public.user_special_dates (
        user_id,
        date,
        date_type,
        visibility,
        is_recurring,
        recurring_type,
        created_at
      ) VALUES (
        NEW.id,
        birthday_date,
        'birthday',
        'shared', -- Default to shared with connections
        true,
        'yearly',
        now()
      );
      
      RAISE NOTICE 'Auto-created birthday event for user % on date %', NEW.id, birthday_date;
    ELSE
      RAISE NOTICE 'Birthday event already exists for user %, skipping creation', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_birthday_event ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_auto_create_birthday_event
  AFTER INSERT OR UPDATE OF dob ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_birthday_event();

COMMENT ON FUNCTION public.auto_create_birthday_event() IS 
  'Automatically creates a birthday event in user_special_dates when a user adds their DOB during signup or profile update. This enables auto-gifting rules to match birthday events.';

COMMENT ON TRIGGER trigger_auto_create_birthday_event ON public.profiles IS
  'Triggers creation of birthday event in user_special_dates when user adds DOB';