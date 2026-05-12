
-- =========================================================
-- 1.1 Profiles: remove broad public exposure, add safe view
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view discoverable profiles" ON public.profiles;

-- Safe public projection of the profiles table (discovery only)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.username,
  p.name,
  p.profile_image,
  p.bio,
  p.profile_type
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.wishlists w
  WHERE w.user_id = p.id AND w.is_public = true
)
OR p.id = auth.uid()
OR public.can_view_profile(p.id) = true;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- =========================================================
-- 1.2 pending_recipient_addresses: require ownership for UPDATE
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can update with valid token"
  ON public.pending_recipient_addresses;

CREATE POLICY "Owner or recipient can update pending address"
  ON public.pending_recipient_addresses
  FOR UPDATE
  TO authenticated
  USING (
    token IS NOT NULL
    AND expires_at > now()
    AND (
      requested_by = auth.uid()
      OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    token IS NOT NULL
    AND expires_at > now()
    AND (
      requested_by = auth.uid()
      OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- =========================================================
-- 2.1 Realtime channel authorization
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Direct message channels: dm:<uuid>:<uuid>
CREATE POLICY "DM participants can subscribe"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'dm:%'
    AND auth.uid()::text = ANY(string_to_array(replace(realtime.topic(), 'dm:', ''), ':'))
  );

-- Funding campaign channels: funding:<campaign_id>
CREATE POLICY "Funding campaign participants can subscribe"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'funding:%'
    AND EXISTS (
      SELECT 1 FROM public.funding_campaigns fc
      WHERE fc.id::text = replace(realtime.topic(), 'funding:', '')
        AND (
          fc.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.contributions c
            WHERE c.campaign_id = fc.id AND c.contributor_id = auth.uid()
          )
        )
    )
  );

-- User-scoped notification channels: user:<uuid>
CREATE POLICY "Users can subscribe to their own user channel"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'user:%'
    AND replace(realtime.topic(), 'user:', '') = auth.uid()::text
  );
