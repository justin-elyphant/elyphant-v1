-- Drop dead columns from privacy_settings
ALTER TABLE public.privacy_settings DROP COLUMN IF EXISTS gift_surprise_mode;
ALTER TABLE public.privacy_settings DROP COLUMN IF EXISTS block_list_visibility;
ALTER TABLE public.privacy_settings DROP COLUMN IF EXISTS show_following_count;

-- Update the trigger function to remove references to dropped columns
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.privacy_settings (
    user_id,
    profile_visibility,
    allow_connection_requests_from,
    allow_message_requests,
    show_follower_count,
    auto_gift_consent,
    wishlist_visibility,
    dob_visibility,
    shipping_address_visibility,
    interests_visibility,
    email_visibility
  ) VALUES (
    NEW.id,
    'public',
    'everyone',
    true,
    true,
    'connections_only',
    'public',
    'friends',
    'private',
    'public',
    'friends'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;