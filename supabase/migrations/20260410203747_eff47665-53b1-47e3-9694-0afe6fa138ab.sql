
-- Step 1: Create a secure view for public profile discovery (no PII)
CREATE OR REPLACE VIEW public.profiles_discoverable AS
SELECT 
  p.id,
  p.name,
  p.username,
  p.profile_image
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.wishlists w
  WHERE w.user_id = p.id
    AND w.is_public = true
);

-- Step 2: Drop the dangerous "Public wishlist owners are discoverable" policy
DROP POLICY IF EXISTS "Public wishlist owners are discoverable" ON public.profiles;
