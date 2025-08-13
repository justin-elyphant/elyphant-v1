-- Create privacy settings for Justin Meeks to allow connected friends to view his profile
INSERT INTO public.privacy_settings (
  user_id,
  profile_visibility,
  allow_follows_from,
  block_list_visibility,
  show_follower_count,
  show_following_count,
  allow_message_requests
) VALUES (
  '0478a7d7-9d59-40bf-954e-657fa28fe251',
  'friends',
  'everyone',
  'hidden',
  true,
  true,
  true
);