ALTER TABLE public.beta_referrals DROP CONSTRAINT IF EXISTS beta_referrals_status_check;
ALTER TABLE public.beta_referrals ADD CONSTRAINT beta_referrals_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'signed_up'::text, 'credit_issued'::text, 'cap_reached'::text, 'rejected'::text, 'reward_paid'::text]));