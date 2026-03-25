
-- 1. Create beta_credits ledger table
CREATE TABLE public.beta_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('issued', 'spent', 'refunded')),
  description text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES public.beta_referrals(id) ON DELETE SET NULL,
  issued_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.beta_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.beta_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Employees can view all credits"
  ON public.beta_credits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can insert credits"
  ON public.beta_credits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can update credits"
  ON public.beta_credits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_beta_credits_user_id ON public.beta_credits(user_id);
CREATE INDEX idx_beta_credits_order_id ON public.beta_credits(order_id);

-- 2. Create get_beta_credit_balance function
CREATE OR REPLACE FUNCTION public.get_beta_credit_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.beta_credits
  WHERE user_id = p_user_id;
$$;

-- 3. Alter beta_referrals to support pending_approval status
ALTER TABLE public.beta_referrals DROP CONSTRAINT IF EXISTS beta_referrals_status_check;
ALTER TABLE public.beta_referrals ADD CONSTRAINT beta_referrals_status_check
  CHECK (status IN ('pending', 'pending_approval', 'signed_up', 'credit_issued', 'rejected', 'reward_paid'));

-- Update default status
ALTER TABLE public.beta_referrals ALTER COLUMN status SET DEFAULT 'pending_approval';

-- 4. Create approve_beta_referral function
CREATE OR REPLACE FUNCTION public.approve_beta_referral(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral record;
  v_credit_id uuid;
BEGIN
  -- Get referral
  SELECT * INTO v_referral FROM public.beta_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
  END IF;

  IF v_referral.status NOT IN ('pending_approval', 'signed_up') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not in approvable state: ' || v_referral.status);
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

-- 5. Create reject_beta_referral function
CREATE OR REPLACE FUNCTION public.reject_beta_referral(p_referral_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.beta_referrals
  SET status = 'rejected', reward_notes = p_notes
  WHERE id = p_referral_id AND status IN ('pending_approval', 'signed_up');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found or not in approvable state');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Update the trigger to use pending_approval status and fire email
CREATE OR REPLACE FUNCTION public.track_beta_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending_invitation' THEN
    INSERT INTO public.beta_referrals (referrer_id, referred_id, referred_email, connection_id, status)
    SELECT
      NEW.user_id,
      NEW.connected_user_id,
      COALESCE(p.email, ''),
      NEW.id,
      'pending_approval'
    FROM public.profiles p
    WHERE p.id = NEW.connected_user_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
