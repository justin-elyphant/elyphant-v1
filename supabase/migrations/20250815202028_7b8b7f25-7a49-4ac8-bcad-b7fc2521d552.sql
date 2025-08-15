-- Update privacy_settings to use 'followers_only' instead of 'friends' to match UI expectations
UPDATE public.privacy_settings 
SET profile_visibility = 'followers_only' 
WHERE profile_visibility = 'friends';