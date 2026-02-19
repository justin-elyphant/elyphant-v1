
-- Update create_default_privacy_settings trigger to include gifting privacy fields
-- and set wishlist_visibility to 'public' by default

CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.privacy_settings (
    user_id,
    allow_connection_requests_from,
    profile_visibility,
    block_list_visibility,
    show_follower_count,
    show_following_count,
    allow_message_requests,
    wishlist_visibility,
    auto_gift_consent,
    gift_surprise_mode
  )
  VALUES (
    NEW.id,
    'everyone',
    'public',
    'hidden',
    true,
    true,
    true,
    'public',
    'connections_only',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Backfill existing users who have NULL for the 3 gifting fields
UPDATE public.privacy_settings
SET
  wishlist_visibility = COALESCE(wishlist_visibility, 'public'),
  auto_gift_consent = COALESCE(auto_gift_consent, 'connections_only'),
  gift_surprise_mode = COALESCE(gift_surprise_mode, true)
WHERE
  wishlist_visibility IS NULL
  OR auto_gift_consent IS NULL
  OR gift_surprise_mode IS NULL;
