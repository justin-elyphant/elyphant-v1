
-- 1. Create beta_feedback_stages table
CREATE TABLE public.beta_feedback_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text NOT NULL,
  feature_area text NOT NULL,
  label text NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback stages" ON public.beta_feedback_stages
  FOR SELECT USING (true);

-- 2. Seed the 5 stages with questions
INSERT INTO public.beta_feedback_stages (stage_key, feature_area, label, description, sort_order) VALUES
  -- Stage 1: First Impressions
  ('first_impressions', 'onboarding', 'Onboarding Experience', 'How was onboarding? Was it clear what to do first?', 1),
  ('first_impressions', 'first_look', 'First Impressions', 'First impressions of the platform look and feel?', 2),
  ('first_impressions', 'clarity', 'Platform Clarity', 'Did you understand what Elyphant does right away?', 3),
  ('first_impressions', 'signup_motivation', 'Signup Motivation', 'How did you hear about us / what made you sign up?', 4),
  -- Stage 2: Explorer
  ('explorer', 'product_search', 'Product Search', 'How was product search? Find what you were looking for?', 1),
  ('explorer', 'missing_products', 'Missing Products', 'What products did you search for that we did not have?', 2),
  ('explorer', 'product_pages', 'Product Pages', 'Rate the product pages — images, descriptions, pricing', 3),
  ('explorer', 'navigation', 'Navigation', 'Anything confusing about navigation?', 4),
  -- Stage 3: Engaged
  ('engaged', 'wishlists', 'Wishlist Experience', 'Rate the wishlist experience — creating, managing, sharing', 1),
  ('engaged', 'inviting', 'Inviting Friends', 'How was inviting a friend? Did they sign up?', 2),
  ('engaged', 'gift_scheduling', 'Gift Scheduling', 'Have you tried scheduling a gift? If not, why?', 3),
  ('engaged', 'purchase_blockers', 'Purchase Blockers', 'What is stopping you from making a purchase?', 4),
  -- Stage 4: Activated
  ('activated', 'checkout', 'Checkout Experience', 'Rate checkout — smooth or friction?', 1),
  ('activated', 'gifting_flow', 'Gifting Flow', 'How was the gifting flow end-to-end?', 2),
  ('activated', 'auto_gifts', 'Auto-Gifts Interest', 'Would you use auto-gifts? Why or why not?', 3),
  ('activated', 'nps', 'Recommendation Score', 'Would you recommend Elyphant to a friend? (1-5)', 4),
  -- Stage 5: Power User
  ('power_user', 'favorite_feature', 'Favorite Feature', 'What feature do you use most? Least?', 1),
  ('power_user', 'missing_feature', 'Missing Feature', 'What is missing that would make this a daily-use app?', 2),
  ('power_user', 'overall_rating', 'Overall Rating', 'Rate the overall platform 1-10', 3),
  ('power_user', 'willingness_to_pay', 'Willingness to Pay', 'Would you pay for this? What would you pay?', 4);

-- 3. Add feedback_stage column to beta_feedback
ALTER TABLE public.beta_feedback ADD COLUMN feedback_stage text;

-- 4. Create the get_tester_feedback_stage RPC
CREATE OR REPLACE FUNCTION public.get_tester_feedback_stage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_age_days int;
  v_wishlist_count int;
  v_invite_count int;
  v_order_count int;
  v_auto_gift_count int;
  v_stage text;
BEGIN
  -- Account age in days
  SELECT EXTRACT(DAY FROM (now() - p.created_at))::int
    INTO v_account_age_days
    FROM profiles p WHERE p.id = p_user_id;

  IF v_account_age_days IS NULL THEN
    RETURN jsonb_build_object('stage', 'first_impressions', 'account_age_days', 0);
  END IF;

  -- Wishlist count
  SELECT count(*) INTO v_wishlist_count
    FROM wishlists WHERE user_id = p_user_id;

  -- Invite/referral count
  SELECT count(*) INTO v_invite_count
    FROM beta_referrals WHERE referrer_id = p_user_id;

  -- Order count
  SELECT count(*) INTO v_order_count
    FROM orders WHERE user_id = p_user_id AND status NOT IN ('cancelled', 'failed');

  -- Auto-gift rule count
  SELECT count(*) INTO v_auto_gift_count
    FROM auto_gifting_rules WHERE user_id = p_user_id AND is_active = true;

  -- Determine stage
  IF v_order_count >= 2 OR v_auto_gift_count > 0 THEN
    v_stage := 'power_user';
  ELSIF v_order_count >= 1 THEN
    v_stage := 'activated';
  ELSIF v_wishlist_count > 0 OR v_invite_count > 0 THEN
    v_stage := 'engaged';
  ELSIF v_account_age_days > 3 THEN
    v_stage := 'explorer';
  ELSE
    v_stage := 'first_impressions';
  END IF;

  RETURN jsonb_build_object(
    'stage', v_stage,
    'account_age_days', v_account_age_days,
    'wishlist_count', v_wishlist_count,
    'invite_count', v_invite_count,
    'order_count', v_order_count,
    'auto_gift_count', v_auto_gift_count
  );
END;
$$;
