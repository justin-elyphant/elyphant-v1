-- Add privacy settings for Dua Lipa to enable search functionality
INSERT INTO public.privacy_settings (
  user_id,
  allow_connection_requests_from,
  profile_visibility,
  block_list_visibility,
  show_follower_count,
  show_following_count,
  allow_message_requests
)
SELECT 
  id,
  'everyone'::text,
  'public'::text,
  'hidden'::text,
  true,
  true,
  true
FROM auth.users 
WHERE email = 'dua@example.com'
ON CONFLICT (user_id) DO UPDATE SET
  profile_visibility = 'public',
  allow_connection_requests_from = 'everyone';