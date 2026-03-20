
-- Create beta_referrals table
CREATE TABLE public.beta_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email text NOT NULL,
  connection_id uuid REFERENCES public.user_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'reward_paid')),
  reward_amount numeric NOT NULL DEFAULT 100.00,
  reward_paid_at timestamptz,
  reward_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals
CREATE POLICY "Users can view own referrals"
  ON public.beta_referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

-- Employees can read all referrals
CREATE POLICY "Employees can view all referrals"
  ON public.beta_referrals
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Employees can update referrals (mark as paid)
CREATE POLICY "Employees can update referrals"
  ON public.beta_referrals
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- System can insert referrals (via trigger)
CREATE POLICY "System can insert referrals"
  ON public.beta_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());

-- Create trigger to auto-populate beta_referrals when invitation is accepted
CREATE OR REPLACE FUNCTION public.track_beta_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes to 'accepted' from 'pending_invitation'
  IF NEW.status = 'accepted' AND OLD.status = 'pending_invitation' THEN
    INSERT INTO public.beta_referrals (referrer_id, referred_id, referred_email, connection_id, status)
    SELECT
      NEW.user_id,
      NEW.connected_user_id,
      COALESCE(p.email, ''),
      NEW.id,
      'signed_up'
    FROM public.profiles p
    WHERE p.id = NEW.connected_user_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invitation_accepted_track_referral
  AFTER UPDATE ON public.user_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.track_beta_referral();

-- Index for efficient lookups
CREATE INDEX idx_beta_referrals_referrer ON public.beta_referrals(referrer_id);
CREATE INDEX idx_beta_referrals_status ON public.beta_referrals(status);
