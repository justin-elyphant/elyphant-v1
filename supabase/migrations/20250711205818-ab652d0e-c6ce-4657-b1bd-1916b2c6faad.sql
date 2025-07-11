-- Phase 4: Enhanced Mandatory Profile Data Collection (Data Fix)
-- Fix data issues before adding constraints

-- Add the new columns that don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- First, fix any existing profiles with missing data
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
        ELSE ''
      END
    ELSE last_name
  END;

-- Update any remaining empty first names
UPDATE public.profiles 
SET first_name = 'User'
WHERE first_name IS NULL OR first_name = '' OR length(trim(first_name)) = 0;

-- Update any remaining empty last names  
UPDATE public.profiles 
SET last_name = 'Name'
WHERE last_name IS NULL OR last_name = '' OR length(trim(last_name)) = 0;

-- Fix email field
UPDATE public.profiles 
SET email = COALESCE(email, 'user@example.com')
WHERE email IS NULL OR email = '';

-- Fix username field
UPDATE public.profiles 
SET username = COALESCE(username, 'user_' || SUBSTRING(id::TEXT, 1, 8))
WHERE username IS NULL OR username = '' OR length(trim(username)) < 3;

-- Make sure all usernames are unique
UPDATE public.profiles 
SET username = 'user_' || SUBSTRING(id::TEXT, 1, 6) || '_' || FLOOR(RANDOM() * 1000)::TEXT
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
    FROM public.profiles
  ) t WHERE t.rn > 1
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
    ALTER TABLE public.profiles ADD CONSTRAINT check_first_name_length CHECK (length(trim(first_name)) >= 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_last_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_last_name_length CHECK (length(trim(last_name)) >= 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_username_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_username_length CHECK (length(trim(username)) >= 3);
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