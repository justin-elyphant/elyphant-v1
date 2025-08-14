-- Add missing privacy settings for users who don't have them
-- This ensures all users have proper default privacy settings

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
  p.id,
  'everyone'::text,  -- Default to allowing connection requests from everyone
  'public'::text,    -- Default to public profile visibility for search
  'hidden'::text,    -- Default to hiding block list
  true,              -- Default to showing follower count
  true,              -- Default to showing following count  
  true               -- Default to allowing message requests
FROM public.profiles p
LEFT JOIN public.privacy_settings ps ON p.id = ps.user_id
WHERE ps.user_id IS NULL;