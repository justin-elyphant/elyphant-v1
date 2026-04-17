-- Lower the credit pool cap
UPDATE public.beta_program_settings SET total_credit_pool = 3000 WHERE id = 1;

-- Update the auto-approved referral RPC
CREATE OR REPLACE FUNCTION public.process_auto_approved_referral(
  p_referral_id uuid,
  p_credit_amount numeric DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_total_issued numeric;
  v_referrer_email text;
  v_is_seeder boolean;
  v_referrer_successful_count integer;
  v_credits_to_deduct numeric;
BEGIN
  SELECT * INTO v_referral FROM public.beta_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'referral_not_found');
  END IF;

  IF v_referral.status = 'credit_issued' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_issued');
  END IF;

  SELECT * INTO v_settings FROM public.beta_program_settings WHERE id = 1;
  IF NOT FOUND OR NOT v_settings.auto_approve_referrals THEN
    RETURN jsonb_build_object('success', false, 'reason', 'auto_approve_disabled');
  END IF;

  -- Identify seeder via @elyphant.com email
  SELECT email INTO v_referrer_email FROM auth.users WHERE id = v_referral.referrer_id;
  v_is_seeder := v_referrer_email IS NOT NULL AND lower(v_referrer_email) LIKE '%@elyphant.com';

  -- Enforce 2-invite cap for non-seeders
  IF NOT v_is_seeder THEN
    SELECT COUNT(*) INTO v_referrer_successful_count
    FROM public.beta_referrals
    WHERE referrer_id = v_referral.referrer_id AND status = 'credit_issued';

    IF v_referrer_successful_count >= 2 THEN
      UPDATE public.beta_referrals
      SET status = 'cap_reached', reward_notes = 'Inviter reached 2-invite cap'
      WHERE id = p_referral_id;
      RETURN jsonb_build_object('success', false, 'reason', 'inviter_cap_reached');
    END IF;
  END IF;

  -- Calculate pool deduction:
  -- Seeders: only $100 (welcome to invitee)
  -- Non-seeders (referred beta testers): only $100 (welcome to invitee, no referrer reward)
  v_credits_to_deduct := p_credit_amount;

  -- Check pool capacity
  SELECT COALESCE(SUM(amount), 0) INTO v_total_issued FROM public.beta_credits;
  IF v_total_issued + v_credits_to_deduct > v_settings.total_credit_pool THEN
    RETURN jsonb_build_object('success', false, 'reason', 'pool_exhausted');
  END IF;

  -- Issue welcome credit to invitee (always)
  IF v_referral.referred_id IS NOT NULL THEN
    INSERT INTO public.beta_credits (user_id, amount, type, referral_id, description)
    VALUES (v_referral.referred_id, p_credit_amount, 'welcome', p_referral_id, 'Welcome credit for joining beta');
  END IF;

  -- No referrer reward issued (per current policy)

  UPDATE public.beta_referrals
  SET status = 'credit_issued',
      reward_amount = p_credit_amount,
      reward_paid_at = now(),
      reward_notes = CASE WHEN v_is_seeder THEN 'Seeder invite - welcome credit only' ELSE 'Referred tester invite - welcome credit only' END
  WHERE id = p_referral_id;

  RETURN jsonb_build_object(
    'success', true,
    'is_seeder', v_is_seeder,
    'welcome_credit_issued', p_credit_amount,
    'referrer_reward_issued', 0
  );
END;
$$;