
-- ============================================================
-- PHASE 3A: Critical RLS Fixes — Location Cache & Pricing
-- ============================================================

-- 1. location_cache: Replace public ALL with service_role + authenticated SELECT
DROP POLICY IF EXISTS "System can manage location cache" ON public.location_cache;
DROP POLICY IF EXISTS "Users can access location cache" ON public.location_cache;

CREATE POLICY "Service role manages location cache"
ON public.location_cache FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read location cache"
ON public.location_cache FOR SELECT TO authenticated
USING (true);

-- 2. pricing_settings: Restrict read to business admins only
DROP POLICY IF EXISTS "Authenticated users can read pricing settings" ON public.pricing_settings;
