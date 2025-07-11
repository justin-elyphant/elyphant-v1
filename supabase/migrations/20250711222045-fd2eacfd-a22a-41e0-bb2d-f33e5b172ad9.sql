-- Phase 1: Critical Database Schema Fixes
-- Fix data migration and constraints for enhanced onboarding

-- Step 1: Migrate existing name data to first_name/last_name properly
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN first_name IS NULL OR first_name = '' THEN 
      COALESCE(SPLIT_PART(name, ' ', 1), SPLIT_PART(email, '@', 1), 'User')
    ELSE first_name
  END,
  last_name = CASE 
    WHEN last_name IS NULL OR last_name = '' THEN 
      CASE 
        WHEN name LIKE '% %' THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
        ELSE 'Name'
      END
    ELSE last_name
  END
WHERE (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '');

-- Step 2: Make birth_year NOT NULL with proper constraints
UPDATE public.profiles 
SET birth_year = CASE 
  WHEN birth_year IS NULL THEN EXTRACT(YEAR FROM NOW()) - 25  -- Default to 25 years old
  ELSE birth_year
END
WHERE birth_year IS NULL;

ALTER TABLE public.profiles 
ALTER COLUMN birth_year SET NOT NULL;

-- Step 3: Add constraint to ensure birth_year is reasonable
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_birth_year_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_birth_year_range 
    CHECK (birth_year >= 1900 AND birth_year <= EXTRACT(YEAR FROM NOW()));
  END IF;
END $$;

-- Step 4: Update handle_new_user function to extract OAuth avatar_url and better data
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
BEGIN
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