
-- =============================================================
-- MIGRATION 2 FINAL: All policy + function hardening
-- =============================================================

-- ---- System tables: public → service_role ----

DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert data access logs" ON public.auto_gift_data_access;
CREATE POLICY "Service role can insert data access logs" ON public.auto_gift_data_access FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert auto-gift event logs" ON public.auto_gift_event_logs;
CREATE POLICY "Service role can insert event logs" ON public.auto_gift_event_logs FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert notifications" ON public.auto_gift_notifications;
CREATE POLICY "Service role can insert notifications" ON public.auto_gift_notifications FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert recommendation analytics" ON public.gift_recommendation_analytics;
CREATE POLICY "Service role can insert recommendation analytics" ON public.gift_recommendation_analytics FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create mentions" ON public.message_mentions;
CREATE POLICY "Service role can create mentions" ON public.message_mentions FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert rate limits" ON public.message_rate_limits;
DROP POLICY IF EXISTS "System can update rate limits" ON public.message_rate_limits;
CREATE POLICY "Service role can insert rate limits" ON public.message_rate_limits FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update rate limits" ON public.message_rate_limits FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert order email events" ON public.order_email_events;
CREATE POLICY "Service role can insert order email events" ON public.order_email_events FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert order contributions" ON public.order_group_contributors;
CREATE POLICY "Service role can insert order contributions" ON public.order_group_contributors FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert address requests" ON public.pending_recipient_addresses;
CREATE POLICY "Service role can insert address requests" ON public.pending_recipient_addresses FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert anomalies" ON public.security_anomalies;
CREATE POLICY "Service role can insert anomalies" ON public.security_anomalies FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert audit records" ON public.security_audit;
CREATE POLICY "Service role can insert audit records" ON public.security_audit FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
CREATE POLICY "Service role can insert security logs" ON public.security_logs FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert ZMA cost tracking" ON public.zma_cost_tracking;
CREATE POLICY "Service role can insert ZMA cost tracking" ON public.zma_cost_tracking FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert security events" ON public.zma_security_events;
DROP POLICY IF EXISTS "System can update security events" ON public.zma_security_events;
CREATE POLICY "Service role can insert security events" ON public.zma_security_events FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update security events" ON public.zma_security_events FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert ZMA rate limits" ON public.zma_order_rate_limits;
DROP POLICY IF EXISTS "System can update ZMA rate limits" ON public.zma_order_rate_limits;
CREATE POLICY "Service role can insert ZMA rate limits" ON public.zma_order_rate_limits FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update ZMA rate limits" ON public.zma_order_rate_limits FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service can manage popularity scores" ON public.popularity_scores;
CREATE POLICY "Service role can manage popularity scores" ON public.popularity_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage vendor accounts" ON public.vendor_accounts;
CREATE POLICY "Service role can manage vendor accounts" ON public.vendor_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- Token validation fix ----
DROP POLICY IF EXISTS "Anyone can update with valid token" ON public.pending_recipient_addresses;
CREATE POLICY "Authenticated users can update with valid token"
ON public.pending_recipient_addresses FOR UPDATE TO authenticated
USING (token IS NOT NULL AND expires_at > now())
WITH CHECK (token IS NOT NULL AND expires_at > now());

-- ---- Email templates ----
DROP POLICY IF EXISTS "Public can read active email templates" ON public.email_templates;
CREATE POLICY "Authenticated can read active email templates"
ON public.email_templates FOR SELECT TO authenticated USING (is_active = true);

-- ---- Function search_path hardening ----
ALTER FUNCTION public.update_vendor_orders_timestamp() SET search_path = '';
ALTER FUNCTION public.alert_stuck_zinc_orders() SET search_path = '';
ALTER FUNCTION public.sync_address_fields() SET search_path = '';
ALTER FUNCTION public.profile_dob_to_birthday_event() SET search_path = '';
ALTER FUNCTION public.get_upcoming_auto_gift_events(integer) SET search_path = '';
ALTER FUNCTION public.get_upcoming_auto_gift_events(integer, uuid) SET search_path = '';
