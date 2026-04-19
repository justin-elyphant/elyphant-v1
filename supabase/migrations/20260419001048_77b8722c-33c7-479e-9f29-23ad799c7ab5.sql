ALTER TABLE public.beta_credits DROP CONSTRAINT IF EXISTS beta_credits_type_check;
ALTER TABLE public.beta_credits ADD CONSTRAINT beta_credits_type_check
  CHECK (type = ANY (ARRAY['issued'::text, 'spent'::text, 'refunded'::text, 'welcome'::text, 'referral_reward'::text]));