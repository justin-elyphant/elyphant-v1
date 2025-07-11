-- Phase 4: Enhanced Mandatory Profile Data Collection (Corrected)
-- Add missing columns and update constraints

-- Add the new columns that don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- Update existing profiles to split name into first_name and last_name
UPDATE public.profiles 
SET 
  first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
  last_name = CASE 
    WHEN name LIKE '% %' THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
    ELSE ''
  END
WHERE (first_name IS NULL OR first_name = '') AND name IS NOT NULL;

-- Set default values for new required fields where null
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, ''),
  last_name = COALESCE(last_name, ''),
  email = COALESCE(email, ''),
  username = COALESCE(username, 'user_' || SUBSTRING(id::TEXT, 1, 8))
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '' OR email IS NULL OR email = '' OR username IS NULL OR username = '';

-- Make sure username is unique for any duplicates
UPDATE public.profiles 
SET username = 'user_' || SUBSTRING(id::TEXT, 1, 6) || '_' || FLOOR(RANDOM() * 1000)::TEXT
WHERE username IN (
  SELECT username 
  FROM public.profiles 
  GROUP BY username 
  HAVING COUNT(*) > 1
);

-- Now make the mandatory fields NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN username SET NOT NULL;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_birth_year') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_birth_year CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= EXTRACT(YEAR FROM NOW())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_first_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_first_name_length CHECK (length(first_name) >= 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_last_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_last_name_length CHECK (length(last_name) >= 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_username_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_username_length CHECK (length(username) >= 3);
  END IF;
END $$;

-- Add unique constraint to username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Update the handle_new_user function to extract OAuth data properly
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
  
  -- Extract names from OAuth metadata
  user_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), ' ', 1),
    ''
  );
  
  user_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'family_name',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') LIKE '% %' 
      THEN TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')) + 1))
      ELSE ''
    END,
    ''
  );
  
  -- Extract avatar URL
  user_avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'profile_image_url'
  );
  
  -- Create full name for backward compatibility
  full_name := TRIM(user_first_name || ' ' || user_last_name);
  IF full_name = '' THEN
    full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '');
  END IF;
  
  -- Generate unique username
  generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 6) || '_' || FLOOR(RANDOM() * 1000);
  END LOOP;
  
  -- Insert profile with extracted data
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    name, 
    email, 
    username,
    profile_image,
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