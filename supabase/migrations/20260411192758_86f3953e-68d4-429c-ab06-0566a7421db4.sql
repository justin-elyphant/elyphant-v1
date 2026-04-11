
-- 1. beta_invite_limits table
CREATE TABLE public.beta_invite_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_invites integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_invite_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invite limits"
  ON public.beta_invite_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to invite limits"
  ON public.beta_invite_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. beta_program_settings table (single-row config)
CREATE TABLE public.beta_program_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_credit_pool integer NOT NULL DEFAULT 25,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_program_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read program settings"
  ON public.beta_program_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access to program settings"
  ON public.beta_program_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed the single config row
INSERT INTO public.beta_program_settings (id, total_credit_pool) VALUES (1, 25);

-- 3. get_remaining_invites RPC
CREATE OR REPLACE FUNCTION public.get_remaining_invites(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_used integer;
  v_bonus integer;
BEGIN
  -- Check if admin (unlimited)
  SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;
  IF v_email = 'justin@elyphant.com' THEN
    RETURN -1;
  END IF;

  -- Count used referrals
  SELECT COUNT(*)::integer INTO v_used
  FROM public.beta_referrals
  WHERE referrer_id = p_user_id;

  -- Get bonus invites
  SELECT COALESCE(bil.bonus_invites, 0) INTO v_bonus
  FROM public.beta_invite_limits bil
  WHERE bil.user_id = p_user_id;

  IF v_bonus IS NULL THEN
    v_bonus := 0;
  END IF;

  RETURN GREATEST(0, (2 + v_bonus) - v_used);
END;
$$;

-- 4. Update approve_beta_referral to check global pool
CREATE OR REPLACE FUNCTION public.approve_beta_referral(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral record;
  v_credit_id uuid;
  v_pool integer;
  v_issued integer;
BEGIN
  -- Get referral
  SELECT * INTO v_referral FROM public.beta_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
  END IF;

  IF v_referral.status NOT IN ('pending_approval', 'signed_up') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not in approvable state: ' || v_referral.status);
  END IF;

  -- Check global credit pool
  SELECT total_credit_pool INTO v_pool FROM public.beta_program_settings WHERE id = 1;
  IF v_pool IS NULL THEN v_pool := 25; END IF;

  SELECT COUNT(*)::integer INTO v_issued FROM public.beta_referrals WHERE status = 'credit_issued';

  IF v_issued >= v_pool THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program credit pool exhausted (' || v_issued || '/' || v_pool || '). Reload the pool from Trunkline to continue.');
  END IF;

  -- Update referral status
  UPDATE public.beta_referrals
  SET status = 'credit_issued'
  WHERE id = p_referral_id;

  -- Insert credit for the referred user
  INSERT INTO public.beta_credits (user_id, amount, type, description, referral_id, issued_by)
  VALUES (
    v_referral.referred_id,
    v_referral.reward_amount,
    'issued',
    'Beta tester signup credit — $' || v_referral.reward_amount::text,
    p_referral_id,
    auth.uid()
  )
  RETURNING id INTO v_credit_id;

  RETURN jsonb_build_object(
    'success', true,
    'credit_id', v_credit_id,
    'referred_id', v_referral.referred_id,
    'amount', v_referral.reward_amount
  );
END;
$$;
