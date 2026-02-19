
-- Add gifting-specific privacy columns to privacy_settings table
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS auto_gift_consent text NOT NULL DEFAULT 'connections_only' 
    CHECK (auto_gift_consent IN ('everyone', 'connections_only', 'nobody')),
  ADD COLUMN IF NOT EXISTS gift_surprise_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wishlist_visibility text NOT NULL DEFAULT 'connections_only'
    CHECK (wishlist_visibility IN ('public', 'connections_only', 'private'));

-- Update profile_visibility to support 'connections_only' value alongside legacy 'followers_only'
-- (We keep 'followers_only' for backward compat with existing rows, just relabel in UI)
