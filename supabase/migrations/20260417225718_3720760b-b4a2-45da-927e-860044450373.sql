-- Bump default pool to $50k (semantics: total dollars budgeted, not row count)
ALTER TABLE public.beta_program_settings ALTER COLUMN total_credit_pool SET DEFAULT 50000;
UPDATE public.beta_program_settings SET total_credit_pool = 50000 WHERE id = 1 AND total_credit_pool = 25;

COMMENT ON COLUMN public.beta_program_settings.total_credit_pool IS
'Total dollars budgeted for the beta credit program. Each invite-link signup costs $200 (invitee $100 welcome + inviter $100 referral_reward). When sum of issued beta_credits.amount approaches this cap, auto-approval halts.';

-- Atomic RPC: locks settings, checks pool in real dollars, issues both credits, updates referral
CREATE OR REPLACE FUNCTION public.process_auto_approved_referral(
  p_referral_id uuid,
  p_credit_amount integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral record;
  v_pool integer;
  v_issued numeric;
  v_existing_count integer;
  v_invitee_credit_id uuid;
  v_inviter_credit_id uuid;
  v_required integer;
BEGIN
  -- Idempotency: bail if credits already exist for this referral
  SELECT COUNT(*)::integer INTO v_existing_count
  FROM public.beta_credits
  WHERE referral_id = p_referral_id;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  -- Get referral
  SELECT * INTO v_referral FROM public.beta_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'referral_not_found');
  END IF;

  -- Lock settings row to serialize concurrent signups
  SELECT total_credit_pool INTO v_pool
  FROM public.beta_program_settings
  WHERE id = 1
  FOR UPDATE;

  IF v_pool IS NULL THEN v_pool := 50000; END IF;

  -- Sum real dollars already issued (welcome + referral_reward + issued)
  SELECT COALESCE(SUM(amount), 0) INTO v_issued
  FROM public.beta_credits
  WHERE type IN ('welcome', 'referral_reward', 'issued');

  v_required := p_credit_amount * 2;

  IF (v_issued + v_required) > v_pool THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'pool_exhausted',
      'pool', v_pool,
      'issued', v_issued,
      'required', v_required
    );
  END IF;

  -- Issue invitee welcome credit
  INSERT INTO public.beta_credits (user_id, amount, type, description, referral_id)
  VALUES (
    v_referral.referred_id,
    p_credit_amount,
    'welcome',
    'Beta welcome credit',
    p_referral_id
  )
  RETURNING id INTO v_invitee_credit_id;

  -- Issue inviter referral reward
  INSERT INTO public.beta_credits (user_id, amount, type, description, referral_id)
  VALUES (
    v_referral.referrer_id,
    p_credit_amount,
    'referral_reward',
    'Referral reward for inviting ' || v_referral.referred_email,
    p_referral_id
  )
  RETURNING id INTO v_inviter_credit_id;

  -- Mark referral as credit_issued so Trunkline analytics count it
  UPDATE public.beta_referrals
  SET status = 'credit_issued',
      reward_paid_at = now()
  WHERE id = p_referral_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitee_credit_id', v_invitee_credit_id,
    'inviter_credit_id', v_inviter_credit_id,
    'pool_remaining', v_pool - (v_issued + v_required)
  );
END;
$$;

-- Update manual approve_beta_referral to use same dollar-based pool counting
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
  v_issued numeric;
BEGIN
  SELECT * INTO v_referral FROM public.beta_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
  END IF;

  IF v_referral.status NOT IN ('pending_approval', 'signed_up') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not in approvable state: ' || v_referral.status);
  END IF;

  -- Lock + check dollar pool
  SELECT total_credit_pool INTO v_pool
  FROM public.beta_program_settings
  WHERE id = 1
  FOR UPDATE;

  IF v_pool IS NULL THEN v_pool := 50000; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_issued
  FROM public.beta_credits
  WHERE type IN ('welcome', 'referral_reward', 'issued');

  IF (v_issued + v_referral.reward_amount) > v_pool THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Program credit pool exhausted ($' || v_issued || '/$' || v_pool || '). Reload the pool from Trunkline to continue.'
    );
  END IF;

  UPDATE public.beta_referrals
  SET status = 'credit_issued',
      reward_paid_at = now()
  WHERE id = p_referral_id;

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