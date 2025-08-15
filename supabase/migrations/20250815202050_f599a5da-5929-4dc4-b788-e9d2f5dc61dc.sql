-- First, drop the existing check constraint
ALTER TABLE public.privacy_settings DROP CONSTRAINT privacy_settings_profile_visibility_check;

-- Update the values from 'friends' to 'followers_only'
UPDATE public.privacy_settings 
SET profile_visibility = 'followers_only' 
WHERE profile_visibility = 'friends';

-- Recreate the check constraint with the correct values
ALTER TABLE public.privacy_settings 
ADD CONSTRAINT privacy_settings_profile_visibility_check 
CHECK (profile_visibility IN ('public', 'followers_only', 'private'));