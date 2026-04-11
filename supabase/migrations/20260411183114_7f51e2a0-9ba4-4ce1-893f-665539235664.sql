
-- First, ensure all SET NULL columns are nullable
ALTER TABLE public.security_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN recipient_id DROP NOT NULL;
ALTER TABLE public.contributions ALTER COLUMN contributor_id DROP NOT NULL;
ALTER TABLE public.business_admins ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.email_templates ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN granted_by DROP NOT NULL;
ALTER TABLE public.zma_balance_audit_log ALTER COLUMN admin_user_id DROP NOT NULL;
ALTER TABLE public.zma_funding_alerts ALTER COLUMN resolved_by DROP NOT NULL;
ALTER TABLE public.zma_funding_schedule ALTER COLUMN admin_confirmed_by DROP NOT NULL;
ALTER TABLE public.zinc_sync_logs ALTER COLUMN triggered_by DROP NOT NULL;
ALTER TABLE public.user_presence ALTER COLUMN typing_in_chat_with DROP NOT NULL;

-- security_logs.user_id -> SET NULL
ALTER TABLE public.security_logs DROP CONSTRAINT IF EXISTS security_logs_user_id_fkey;
ALTER TABLE public.security_logs ADD CONSTRAINT security_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- messages.sender_id -> SET NULL
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- messages.recipient_id -> SET NULL
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- contributions.contributor_id -> SET NULL
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_contributor_id_fkey;
ALTER TABLE public.contributions ADD CONSTRAINT contributions_contributor_id_fkey
  FOREIGN KEY (contributor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- business_admins.created_by -> SET NULL
ALTER TABLE public.business_admins DROP CONSTRAINT IF EXISTS business_admins_created_by_fkey;
ALTER TABLE public.business_admins ADD CONSTRAINT business_admins_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- email_templates.created_by -> SET NULL
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_roles.granted_by -> SET NULL
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_granted_by_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_granted_by_fkey
  FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- zma_balance_audit_log.admin_user_id -> SET NULL
ALTER TABLE public.zma_balance_audit_log DROP CONSTRAINT IF EXISTS zma_balance_audit_log_admin_user_id_fkey;
ALTER TABLE public.zma_balance_audit_log ADD CONSTRAINT zma_balance_audit_log_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- zma_funding_alerts.resolved_by -> SET NULL
ALTER TABLE public.zma_funding_alerts DROP CONSTRAINT IF EXISTS zma_funding_alerts_resolved_by_fkey;
ALTER TABLE public.zma_funding_alerts ADD CONSTRAINT zma_funding_alerts_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- zma_funding_schedule.admin_confirmed_by -> SET NULL
ALTER TABLE public.zma_funding_schedule DROP CONSTRAINT IF EXISTS zma_funding_schedule_admin_confirmed_by_fkey;
ALTER TABLE public.zma_funding_schedule ADD CONSTRAINT zma_funding_schedule_admin_confirmed_by_fkey
  FOREIGN KEY (admin_confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- zinc_sync_logs.triggered_by -> SET NULL
ALTER TABLE public.zinc_sync_logs DROP CONSTRAINT IF EXISTS zinc_sync_logs_triggered_by_fkey;
ALTER TABLE public.zinc_sync_logs ADD CONSTRAINT zinc_sync_logs_triggered_by_fkey
  FOREIGN KEY (triggered_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_presence.typing_in_chat_with -> SET NULL
ALTER TABLE public.user_presence DROP CONSTRAINT IF EXISTS user_presence_typing_in_chat_with_fkey;
ALTER TABLE public.user_presence ADD CONSTRAINT user_presence_typing_in_chat_with_fkey
  FOREIGN KEY (typing_in_chat_with) REFERENCES auth.users(id) ON DELETE SET NULL;

-- funding_campaigns.creator_id -> CASCADE
ALTER TABLE public.funding_campaigns DROP CONSTRAINT IF EXISTS funding_campaigns_creator_id_fkey;
ALTER TABLE public.funding_campaigns ADD CONSTRAINT funding_campaigns_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- message_rate_limits.user_id -> CASCADE
ALTER TABLE public.message_rate_limits DROP CONSTRAINT IF EXISTS message_rate_limits_user_id_fkey;
ALTER TABLE public.message_rate_limits ADD CONSTRAINT message_rate_limits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- offline_message_queue.user_id -> CASCADE
ALTER TABLE public.offline_message_queue DROP CONSTRAINT IF EXISTS offline_message_queue_user_id_fkey;
ALTER TABLE public.offline_message_queue ADD CONSTRAINT offline_message_queue_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- pending_recipient_addresses.requested_by -> CASCADE
ALTER TABLE public.pending_recipient_addresses DROP CONSTRAINT IF EXISTS pending_recipient_addresses_requested_by_fkey;
ALTER TABLE public.pending_recipient_addresses ADD CONSTRAINT pending_recipient_addresses_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- typing_indicators.user_id -> CASCADE
ALTER TABLE public.typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_user_id_fkey;
ALTER TABLE public.typing_indicators ADD CONSTRAINT typing_indicators_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- typing_indicators.chat_with_user_id -> CASCADE
ALTER TABLE public.typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_chat_with_user_id_fkey;
ALTER TABLE public.typing_indicators ADD CONSTRAINT typing_indicators_chat_with_user_id_fkey
  FOREIGN KEY (chat_with_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
