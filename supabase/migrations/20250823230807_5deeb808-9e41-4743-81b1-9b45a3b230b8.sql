-- Update the handle_new_user function to properly handle Google OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_first_name text;
  extracted_last_name text;
  full_name text;
  default_birth_year integer := 1990; -- Default for employee accounts
BEGIN
  -- Extract name data from raw_user_meta_data
  full_name := new.raw_user_meta_data ->> 'full_name';
  extracted_first_name := new.raw_user_meta_data ->> 'first_name';
  extracted_last_name := new.raw_user_meta_data ->> 'last_name';
  
  -- If first_name and last_name are not available, try to parse from full_name
  IF extracted_first_name IS NULL AND full_name IS NOT NULL THEN
    -- Split full_name on first space
    extracted_first_name := split_part(full_name, ' ', 1);
    -- Get everything after first space as last name
    extracted_last_name := trim(substring(full_name from position(' ' in full_name) + 1));
    -- If no space found, use full_name as first_name
    IF extracted_last_name = '' THEN
      extracted_last_name := 'User';
    END IF;
  END IF;
  
  -- Fallback to email-based name if still null
  IF extracted_first_name IS NULL THEN
    extracted_first_name := split_part(new.email, '@', 1);
    extracted_last_name := 'User';
  END IF;
  
  -- Insert profile with proper data
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    birth_year,
    email,
    profile_type
  )
  VALUES (
    new.id,
    extracted_first_name,
    extracted_last_name,
    COALESCE((new.raw_user_meta_data ->> 'birth_year')::integer, default_birth_year),
    new.email,
    CASE 
      WHEN new.email ILIKE '%@elyphant.com' THEN 'employee'
      ELSE 'customer'
    END
  );
  
  RETURN new;
END;
$$;