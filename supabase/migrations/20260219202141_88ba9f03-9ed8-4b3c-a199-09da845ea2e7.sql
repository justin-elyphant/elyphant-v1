
-- Backfill existing users: update wishlist_visibility from connections_only to public
-- (These users had it explicitly set before the new default was established)
UPDATE public.privacy_settings
SET wishlist_visibility = 'public'
WHERE wishlist_visibility = 'connections_only';
