
-- ============================================================
-- FIX 1: nicole_discovery_log — public ALL → service_role ALL
-- ============================================================
DROP POLICY IF EXISTS "System can manage Nicole discovery logs" ON public.nicole_discovery_log;

CREATE POLICY "Service role can manage Nicole discovery logs"
ON public.nicole_discovery_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- FIX 2a: vendor_locations — public ALL → service_role ALL
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage vendor locations" ON public.vendor_locations;

CREATE POLICY "Service role can manage vendor locations"
ON public.vendor_locations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- FIX 2b: shipping_zones — public ALL → service_role ALL
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage shipping zones" ON public.shipping_zones;

CREATE POLICY "Service role can manage shipping zones"
ON public.shipping_zones
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- FIX 3: gift_preview_tokens — remove broad public SELECT
-- Replace with service_role only (lookups via edge functions)
-- ============================================================
DROP POLICY IF EXISTS "Gift preview tokens are publicly accessible via token" ON public.gift_preview_tokens;

CREATE POLICY "Service role can manage gift preview tokens"
ON public.gift_preview_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- FIX 4: contributions — remove unauthenticated public read
-- Replace with: campaign creator + contributors can view
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view non-anonymous contributions" ON public.contributions;

CREATE POLICY "Campaign participants can view non-anonymous contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (
  is_anonymous = false
  AND (
    contributor_id = auth.uid()
    OR campaign_id IN (
      SELECT id FROM public.funding_campaigns WHERE creator_id = auth.uid()
    )
  )
);

-- ============================================================
-- FIX 5: recipient_preferences — remove user_id IS NULL bypass
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own recipient preferences" ON public.recipient_preferences;
DROP POLICY IF EXISTS "Users can update their own recipient preferences" ON public.recipient_preferences;
DROP POLICY IF EXISTS "Users can create recipient preferences" ON public.recipient_preferences;

CREATE POLICY "Users can view their own recipient preferences"
ON public.recipient_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipient preferences"
ON public.recipient_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create recipient preferences"
ON public.recipient_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
