ALTER TABLE public.beta_program_settings
ADD COLUMN IF NOT EXISTS auto_approve_referrals boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.beta_program_settings.auto_approve_referrals IS
'When true, invite-link signups are auto-approved: both inviter and invitee receive $100 credits immediately. When false, falls back to manual admin approval via Trunkline.';