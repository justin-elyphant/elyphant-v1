-- Insert privacy settings for Dua Lipa to allow friends to view profile
INSERT INTO public.privacy_settings (
  user_id,
  profile_visibility,
  allow_connection_requests_from,
  block_list_visibility,
  show_follower_count,
  show_following_count,
  allow_message_requests,
  created_at,
  updated_at
) VALUES (
  '54087479-29f1-4f7f-afd0-cbdc31d6fb91',
  'friends',
  'everyone',
  'hidden',
  true,
  true,
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  profile_visibility = EXCLUDED.profile_visibility,
  updated_at = now();