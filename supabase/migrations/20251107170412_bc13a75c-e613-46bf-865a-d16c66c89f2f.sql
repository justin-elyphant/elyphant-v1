-- Create/replace trigger function to sync profile.dob to user_special_dates (birthday)
-- Safely handles inserts and updates; idempotent

-- Function: public.profile_dob_to_birthday_event()
CREATE OR REPLACE FUNCTION public.profile_dob_to_birthday_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  month_part text;
  day_part text;
  birthday_this_year date;
  birthday_date date;
  existing_id uuid;
BEGIN
  -- Only act on INSERT, or UPDATE when dob actually changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.dob IS DISTINCT FROM OLD.dob)) THEN
    -- Require MM-DD format, skip if null or wrong length
    IF NEW.dob IS NULL OR length(NEW.dob) <> 5 THEN
      RETURN NEW;
    END IF;

    month_part := split_part(NEW.dob, '-', 1);
    day_part := split_part(NEW.dob, '-', 2);

    -- Basic numeric validation (MM and DD)
    IF month_part !~ '^[0-1][0-9]$' OR day_part !~ '^[0-3][0-9]$' THEN
      RETURN NEW;
    END IF;

    -- Compute next birthday date (this year or next year if already passed)
    birthday_this_year := (extract(year from current_date)::text || '-' || month_part || '-' || day_part)::date;
    IF birthday_this_year < current_date THEN
      birthday_date := (extract(year from (current_date + interval '1 year'))::text || '-' || month_part || '-' || day_part)::date;
    ELSE
      birthday_date := birthday_this_year;
    END IF;

    -- Find existing birthday special date for the user
    SELECT id INTO existing_id
    FROM public.user_special_dates
    WHERE user_id = NEW.id AND date_type = 'birthday'
    LIMIT 1;

    IF existing_id IS NULL THEN
      -- Insert birthday special date
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
        'shared',
        true,
        'yearly',
        now()
      );
    ELSE
      -- Update existing birthday date (avoid referencing columns that may not exist)
      UPDATE public.user_special_dates
      SET date = birthday_date
      WHERE id = existing_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger is present and up-to-date
DROP TRIGGER IF EXISTS profile_dob_to_birthday_event_trigger ON public.profiles;
CREATE TRIGGER profile_dob_to_birthday_event_trigger
AFTER INSERT OR UPDATE OF dob ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profile_dob_to_birthday_event();
