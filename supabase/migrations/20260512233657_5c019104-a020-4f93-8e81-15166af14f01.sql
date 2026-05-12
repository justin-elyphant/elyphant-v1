
-- 1) PROFILES: column-level REVOKE for sensitive PII + behavioral data.
REVOKE SELECT (
  email, dob, birth_year, shipping_address,
  ai_interaction_data, enhanced_ai_interaction_data,
  gifting_history, enhanced_gifting_history,
  signup_metadata, source_attribution, signup_source
) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile_private()
RETURNS TABLE (
  email text,
  dob text,
  birth_year integer,
  shipping_address jsonb,
  ai_interaction_data jsonb,
  enhanced_ai_interaction_data jsonb,
  gifting_history jsonb,
  enhanced_gifting_history jsonb,
  signup_metadata jsonb,
  source_attribution jsonb,
  signup_source text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.email, p.dob, p.birth_year, p.shipping_address,
    p.ai_interaction_data, p.enhanced_ai_interaction_data,
    p.gifting_history, p.enhanced_gifting_history,
    p.signup_metadata, p.source_attribution, p.signup_source
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile_private() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_private() TO authenticated;

-- 2) USER_CONNECTIONS: column-level REVOKE on pending recipient PII.
REVOKE SELECT (
  pending_recipient_email,
  pending_recipient_phone,
  pending_recipient_dob,
  pending_shipping_address
) ON public.user_connections FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_pending_connection(_connection_id uuid)
RETURNS TABLE (
  pending_recipient_email text,
  pending_recipient_phone text,
  pending_recipient_dob text,
  pending_shipping_address jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT uc.pending_recipient_email, uc.pending_recipient_phone,
    uc.pending_recipient_dob, uc.pending_shipping_address
  FROM public.user_connections uc
  WHERE uc.id = _connection_id AND uc.user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_pending_connection(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_pending_connection(uuid) TO authenticated;

-- 3) USER_ROLES: prevent admin self-grant.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can grant non-admin roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role <> 'admin'::app_role);

CREATE POLICY "Admins can update non-admin roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND role <> 'admin'::app_role)
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role <> 'admin'::app_role);

CREATE POLICY "Admins can delete non-admin roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND role <> 'admin'::app_role);

-- 4) STORAGE: tighten email-assets INSERT.
DROP POLICY IF EXISTS "Authenticated users can upload email assets" ON storage.objects;

CREATE POLICY "Business admins can upload email assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND is_business_admin(auth.uid()));

-- 5) REALTIME: remove sensitive tables from broadcast publication.
ALTER PUBLICATION supabase_realtime DROP TABLE public.contributions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.funding_campaigns;
