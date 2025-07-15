-- Fix handle_new_user trigger to not overwrite existing profile data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;