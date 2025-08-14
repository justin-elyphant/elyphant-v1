-- Add default privacy settings for Dua Lipa to enable search functionality
INSERT INTO public.privacy_settings (
  user_id,
  profile_visibility,
  search_visibility,
  activity_visibility,
  gifting_visibility,
  connection_visibility
)
SELECT 
  id,
  'friends'::sharing_level,
  'public'::sharing_level,
  'friends'::sharing_level,
  'friends'::sharing_level,
  'friends'::sharing_level
FROM auth.users 
WHERE email = 'dua@example.com'
ON CONFLICT (user_id) DO UPDATE SET
  search_visibility = 'public',
  profile_visibility = 'friends';