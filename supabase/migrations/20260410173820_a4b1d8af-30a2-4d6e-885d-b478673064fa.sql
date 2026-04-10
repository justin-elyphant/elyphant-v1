
-- Fix zma_funding_alerts: authenticated → service_role
DROP POLICY IF EXISTS "System can insert funding alerts" ON public.zma_funding_alerts;
CREATE POLICY "Service role can insert funding alerts" ON public.zma_funding_alerts FOR INSERT TO service_role WITH CHECK (true);

-- Fix email_analytics: public → authenticated
DROP POLICY IF EXISTS "Business admins can view email analytics" ON public.email_analytics;
CREATE POLICY "Business admins can view email analytics" ON public.email_analytics FOR SELECT TO authenticated USING (is_business_admin(auth.uid()));
