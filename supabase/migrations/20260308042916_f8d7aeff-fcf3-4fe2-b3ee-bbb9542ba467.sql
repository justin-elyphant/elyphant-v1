-- Update handle_new_user to assign profile_type='vendor' for vendor signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_first_name text;
  extracted_last_name text;
  extracted_username text;
  full_name text;
  default_birth_year integer := 1990;
  username_suffix integer := 1;
  final_username text;
BEGIN
  full_name := new.raw_user_meta_data ->> 'full_name';
  extracted_first_name := new.raw_user_meta_data ->> 'first_name';
  extracted_last_name := new.raw_user_meta_data ->> 'last_name';
  
  IF extracted_first_name IS NULL AND full_name IS NOT NULL THEN
    extracted_first_name := split_part(full_name, ' ', 1);
    extracted_last_name := trim(substring(full_name from position(' ' in full_name) + 1));
    IF extracted_last_name = '' THEN
      extracted_last_name := 'User';
    END IF;
  END IF;
  
  IF extracted_first_name IS NULL THEN
    extracted_first_name := split_part(new.email, '@', 1);
    extracted_last_name := 'User';
  END IF;
  
  extracted_username := split_part(new.email, '@', 1);
  final_username := extracted_username;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := extracted_username || username_suffix::text;
    username_suffix := username_suffix + 1;
  END LOOP;
  
  INSERT INTO public.profiles (
    id, 
    username,
    first_name, 
    last_name, 
    birth_year,
    email,
    profile_type
  )
  VALUES (
    new.id,
    final_username,
    extracted_first_name,
    extracted_last_name,
    COALESCE((new.raw_user_meta_data ->> 'birth_year')::integer, default_birth_year),
    new.email,
    CASE 
      WHEN new.email ILIKE '%@elyphant.com' THEN 'employee'
      WHEN new.raw_user_meta_data->>'user_type' = 'vendor' THEN 'vendor'
      ELSE 'customer'
    END
  );
  
  RETURN new;
END;
$$;