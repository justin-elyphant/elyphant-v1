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
  '33a4b6b5-7c8e-4c24-9b85-4b8c9d2e3f41',
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