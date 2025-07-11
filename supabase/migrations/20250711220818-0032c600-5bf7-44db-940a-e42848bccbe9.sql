-- Add new mandatory profile fields for enhanced onboarding
-- Add first_name and last_name columns to replace single name field
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add birth_year column for AI age-appropriate recommendations  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- Update existing profiles to split name into first_name and last_name where possible
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND trim(name) != '' THEN
      split_part(trim(name), ' ', 1)
    ELSE first_name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND trim(name) != '' AND array_length(string_to_array(trim(name), ' '), 1) > 1 THEN
      trim(substring(name from position(' ' in name) + 1))
    ELSE last_name  
  END
WHERE (first_name IS NULL OR last_name IS NULL) AND name IS NOT NULL;

-- Add constraints for mandatory fields
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_first_name_not_empty CHECK (first_name IS NULL OR length(trim(first_name)) > 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_last_name_not_empty CHECK (last_name IS NULL OR length(trim(last_name)) > 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_birth_year_valid CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= extract(year from now())::integer));

-- Update data_sharing_settings to include email field if missing
UPDATE public.profiles 
SET data_sharing_settings = COALESCE(data_sharing_settings, '{}'::jsonb) || '{"email": "private"}'::jsonb
WHERE data_sharing_settings IS NULL OR NOT data_sharing_settings ? 'email';

-- Create index for better performance on birth_year queries
CREATE INDEX IF NOT EXISTS idx_profiles_birth_year ON public.profiles(birth_year) WHERE birth_year IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.first_name IS 'First name - mandatory field for enhanced AI recommendations';
COMMENT ON COLUMN public.profiles.last_name IS 'Last name - mandatory field for enhanced AI recommendations';  
COMMENT ON COLUMN public.profiles.birth_year IS 'Birth year - used for age-appropriate gift suggestions and user matching';