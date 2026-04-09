-- Step 1: Add 4 new visibility columns to privacy_settings
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS dob_visibility text NOT NULL DEFAULT 'friends',
  ADD COLUMN IF NOT EXISTS shipping_address_visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS interests_visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS email_visibility text NOT NULL DEFAULT 'friends';

-- Step 2: Migrate existing data from profiles.data_sharing_settings JSONB
-- Only updates rows where profiles has data_sharing_settings set
UPDATE public.privacy_settings ps
SET
  dob_visibility = COALESCE((p.data_sharing_settings->>'dob'), 'friends'),
  shipping_address_visibility = COALESCE((p.data_sharing_settings->>'shipping_address'), 'private'),
  interests_visibility = COALESCE(
    (p.data_sharing_settings->>'interests'),
    (p.data_sharing_settings->>'gift_preferences'),
    'public'
  ),
  email_visibility = COALESCE((p.data_sharing_settings->>'email'), 'friends')
FROM public.profiles p
WHERE ps.user_id = p.id
  AND p.data_sharing_settings IS NOT NULL;