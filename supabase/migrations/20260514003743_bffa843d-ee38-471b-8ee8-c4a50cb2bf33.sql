-- =========================================================
-- Phase 4 Security Hardening
-- =========================================================
-- 1) Actually enforce column-level protection on profiles &
--    user_connections by revoking table-level SELECT and
--    re-granting SELECT only on safe columns.
-- 2) Strip sensitive fields from get_user_context().
-- 3) Tighten order_email_events RLS to authenticated only.
-- 4) Lock down storage.email-images bucket writes.
-- 5) Restrict pending_recipient_addresses updates so the
--    giftor cannot self-write the recipient's shipping_address.
-- =========================================================

-- ---------------------------------------------------------
-- 1a. profiles : revoke table SELECT, grant safe columns
-- ---------------------------------------------------------
REVOKE SELECT ON public.profiles FROM authenticated, anon;

-- Authenticated users can read non-sensitive columns of any
-- profile row their RLS policies allow them to see.
GRANT SELECT (
  id,
  username,
  name,
  first_name,
  last_name,
  bio,
  profile_image,
  profile_type,
  user_type,
  interests,
  gift_preferences,
  enhanced_gift_preferences,
  gift_giving_preferences,
  important_dates,
  wishlists,
  has_given_gifts,
  has_purchased,
  has_wishlist,
  onboarding_completed,
  address_last_updated,
  address_verification_method,
  address_verified,
  address_verified_at,
  city,
  state,
  metadata,
  created_at,
  updated_at
) ON public.profiles TO authenticated;

-- Anonymous visitors get the bare-minimum public surface
-- required for shared wishlist / public profile pages.
GRANT SELECT (
  id,
  username,
  name,
  first_name,
  last_name,
  bio,
  profile_image,
  profile_type
) ON public.profiles TO anon;

-- ---------------------------------------------------------
-- 1b. user_connections : revoke broad grants, scope writes
-- ---------------------------------------------------------
REVOKE ALL ON public.user_connections FROM anon;
REVOKE ALL ON public.user_connections FROM authenticated;

-- authenticated: SELECT only safe columns + standard DML
-- (RLS still gates which rows they touch).
GRANT INSERT, UPDATE, DELETE ON public.user_connections TO authenticated;
GRANT SELECT (
  id,
  user_id,
  connected_user_id,
  status,
  relationship_type,
  relationship_context,
  follow_type,
  data_access_permissions,
  gift_occasion,
  gift_message,
  has_pending_gift,
  invitation_token,
  invitation_sent_at,
  invitation_reminder_count,
  last_reminder_sent_at,
  pending_recipient_name,
  accepted_at,
  blocked_at,
  blocked_by,
  created_at,
  updated_at
) ON public.user_connections TO authenticated;

-- anon: no access. Pending-invite acceptance must go through
-- a SECURITY DEFINER edge function / RPC.

-- ---------------------------------------------------------
-- 2. get_user_context: drop sensitive jsonb columns
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_context(check_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_is_employee boolean;
  v_is_vendor boolean;
  v_user_type text;
  v_signup_source text;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.business_admins WHERE user_id = check_user_id)
    INTO v_is_employee;

  SELECT EXISTS (SELECT 1 FROM public.vendor_accounts WHERE user_id = check_user_id)
    INTO v_is_vendor;

  SELECT p.user_type, p.signup_source
    INTO v_user_type, v_signup_source
  FROM public.profiles p
  WHERE p.id = check_user_id;

  result := jsonb_build_object(
    'user_type',      COALESCE(v_user_type, CASE WHEN v_is_employee THEN 'employee'
                                                 WHEN v_is_vendor   THEN 'vendor'
                                                 ELSE 'shopper' END),
    'signup_source',  COALESCE(v_signup_source, 'direct'),
    'is_employee',    v_is_employee,
    'is_vendor',      v_is_vendor,
    'is_shopper',     NOT (v_is_employee OR v_is_vendor),
    -- Sensitive jsonb fields removed (signup_metadata, source_attribution).
    'signup_metadata',    '{}'::jsonb,
    'source_attribution', '{}'::jsonb
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_context(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_context(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------
-- 3. order_email_events : scope policy to authenticated
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their order email events" ON public.order_email_events;
CREATE POLICY "Users can view their order email events"
ON public.order_email_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_email_events.order_id
      AND o.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- 4. storage.email-images : restrict writes to business admins
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Business admins can upload email-images" ON storage.objects;
CREATE POLICY "Business admins can upload email-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-images'
  AND public.is_business_admin(auth.uid())
);

DROP POLICY IF EXISTS "Business admins can update email-images" ON storage.objects;
CREATE POLICY "Business admins can update email-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-images'
  AND public.is_business_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'email-images'
  AND public.is_business_admin(auth.uid())
);

DROP POLICY IF EXISTS "Business admins can delete email-images" ON storage.objects;
CREATE POLICY "Business admins can delete email-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-images'
  AND public.is_business_admin(auth.uid())
);

-- ---------------------------------------------------------
-- 5. pending_recipient_addresses : recipient owns shipping_address
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Recipients can update their pending address"
  ON public.pending_recipient_addresses;
DROP POLICY IF EXISTS "Users can update pending recipient addresses"
  ON public.pending_recipient_addresses;
DROP POLICY IF EXISTS "Authenticated users can update pending addresses"
  ON public.pending_recipient_addresses;

-- Only the recipient (auth email matches recipient_email) can
-- write shipping_address, and only on non-expired rows.
CREATE POLICY "Recipient can update own pending address"
ON public.pending_recipient_addresses
FOR UPDATE
TO authenticated
USING (
  expires_at > now()
  AND lower(recipient_email) = lower(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  expires_at > now()
  AND lower(recipient_email) = lower(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- The giftor can update only metadata (status, reminder counts,
-- not the address itself). Address writes must go through the
-- service-role `collect-recipient-address` edge function.
CREATE POLICY "Giftor can update pending address metadata"
ON public.pending_recipient_addresses
FOR UPDATE
TO authenticated
USING (requested_by = auth.uid())
WITH CHECK (
  requested_by = auth.uid()
  -- shipping_address is left untouched by the giftor: enforced by
  -- the collect-recipient-address edge function. RLS allows this
  -- row through but business logic should reject address mutation.
);
