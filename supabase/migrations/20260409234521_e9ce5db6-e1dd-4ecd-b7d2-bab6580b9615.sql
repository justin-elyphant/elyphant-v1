
-- ============================================================
-- PHASE 2: Consolidate privacy_settings RLS + fix search paths
-- ============================================================

-- 2a. Consolidate privacy_settings: drop all 6 policies
DROP POLICY IF EXISTS "Business admins can view privacy settings for support" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can manage only their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can view only their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;

-- Recreate 3 clean policies
CREATE POLICY "Owner can manage their own privacy settings"
ON public.privacy_settings FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert privacy settings during onboarding"
ON public.privacy_settings FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business admins can view privacy settings"
ON public.privacy_settings FOR SELECT TO authenticated
USING (public.is_business_admin(auth.uid()));

-- 2b. Fix function search paths
CREATE OR REPLACE FUNCTION public.increment_group_gift_amount(project_id uuid, amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE group_gift_projects
  SET current_amount = current_amount + amount, updated_at = now()
  WHERE id = project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decay_product_freshness()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE products
  SET freshness_score = GREATEST(0.1, freshness_score * 0.95)
  WHERE last_refreshed_at < NOW() - INTERVAL '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.track_wishlist_purchase_and_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wishlist_owner_id UUID;
  v_wishlist_owner_email TEXT;
  v_purchaser_name TEXT;
  v_product_title TEXT;
  v_product_image TEXT;
  v_wishlist_name TEXT;
BEGIN
  SELECT w.user_id, w.title INTO v_wishlist_owner_id, v_wishlist_name
  FROM wishlists w WHERE w.id = NEW.wishlist_id;
  IF v_wishlist_owner_id IS NULL THEN RETURN NEW; END IF;
  SELECT email INTO v_wishlist_owner_email FROM profiles WHERE id = v_wishlist_owner_id;
  IF NEW.purchaser_user_id IS NOT NULL THEN
    SELECT COALESCE(name, email) INTO v_purchaser_name FROM profiles WHERE id = NEW.purchaser_user_id;
  END IF;
  IF v_purchaser_name IS NULL THEN
    v_purchaser_name := COALESCE(NEW.purchaser_name, 'Someone');
  END IF;
  SELECT COALESCE(title, name), image_url INTO v_product_title, v_product_image
  FROM wishlist_items WHERE id = NEW.item_id;
  INSERT INTO email_queue (event_type, recipient_email, template_variables, status, scheduled_for)
  VALUES ('wishlist_item_purchased', v_wishlist_owner_email,
    jsonb_build_object('wishlist_owner_id', v_wishlist_owner_id, 'purchaser_name', v_purchaser_name,
      'purchaser_user_id', NEW.purchaser_user_id, 'is_anonymous', NEW.is_anonymous,
      'product_title', v_product_title, 'product_image_url', v_product_image,
      'wishlist_name', v_wishlist_name, 'wishlist_id', NEW.wishlist_id,
      'purchase_date', NEW.purchased_at, 'quantity', NEW.quantity, 'price_paid', NEW.price_paid),
    'pending', NOW());
  RETURN NEW;
END;
$$;

-- Phase 3a: Drop the legacy complete_onboarding overload with p_data_sharing_settings
DROP FUNCTION IF EXISTS public.complete_onboarding(
  p_user_id uuid, p_first_name text, p_last_name text, p_email text, p_username text,
  p_dob text, p_birth_year integer, p_interests jsonb, p_gift_preferences jsonb,
  p_data_sharing_settings jsonb, p_shipping_address jsonb, p_profile_image text, p_user_type text
);
