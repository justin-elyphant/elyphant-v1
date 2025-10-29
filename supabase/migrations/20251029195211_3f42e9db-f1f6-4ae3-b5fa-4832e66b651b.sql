-- Create function to automatically create default privacy settings when a profile is created
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if privacy_settings don't already exist
  INSERT INTO public.privacy_settings (
    user_id,
    profile_visibility,
    allow_connection_requests_from,
    allow_message_requests,
    block_list_visibility,
    show_follower_count,
    show_following_count
  ) VALUES (
    NEW.id,
    'public',
    'everyone',
    true,
    'hidden',
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to run after profile insert
DROP TRIGGER IF EXISTS create_privacy_settings_on_profile_insert ON public.profiles;
CREATE TRIGGER create_privacy_settings_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_privacy_settings();

-- Backfill existing profiles that don't have privacy_settings
INSERT INTO public.privacy_settings (
  user_id,
  profile_visibility,
  allow_connection_requests_from,
  allow_message_requests,
  block_list_visibility,
  show_follower_count,
  show_following_count
)
SELECT 
  p.id,
  'public',
  'everyone',
  true,
  'hidden',
  true,
  true
FROM public.profiles p
LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
WHERE ps.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;