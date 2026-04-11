
-- ============================================================
-- Part 1: Remaining FK constraints on auth.users
-- ============================================================

-- profiles.id -> CASCADE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- orders.user_id -> SET NULL (preserve order records)
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- api_keys.user_id -> CASCADE
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- privacy_settings.user_id -> CASCADE
ALTER TABLE public.privacy_settings DROP CONSTRAINT IF EXISTS privacy_settings_user_id_fkey;
ALTER TABLE public.privacy_settings ADD CONSTRAINT privacy_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- blocked_users.blocker_id -> CASCADE
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocker_id_fkey
  FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- blocked_users.blocked_id -> CASCADE
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocked_id_fkey
  FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- auto_gifting_settings.user_id -> CASCADE
ALTER TABLE public.auto_gifting_settings DROP CONSTRAINT IF EXISTS auto_gifting_settings_user_id_fkey;
ALTER TABLE public.auto_gifting_settings ADD CONSTRAINT auto_gifting_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_search_history.user_id -> CASCADE
ALTER TABLE public.user_search_history DROP CONSTRAINT IF EXISTS user_search_history_user_id_fkey;
ALTER TABLE public.user_search_history ADD CONSTRAINT user_search_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- gift_templates.user_id -> SET NULL
ALTER TABLE public.gift_templates ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.gift_templates DROP CONSTRAINT IF EXISTS gift_templates_user_id_fkey;
ALTER TABLE public.gift_templates ADD CONSTRAINT gift_templates_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- address_intelligence.user_id -> CASCADE
ALTER TABLE public.address_intelligence DROP CONSTRAINT IF EXISTS address_intelligence_user_id_fkey;
ALTER TABLE public.address_intelligence ADD CONSTRAINT address_intelligence_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_presence.user_id -> CASCADE
ALTER TABLE public.user_presence DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;
ALTER TABLE public.user_presence ADD CONSTRAINT user_presence_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- payment_methods.user_id -> CASCADE
ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- product_analytics.user_id -> SET NULL
ALTER TABLE public.product_analytics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.product_analytics DROP CONSTRAINT IF EXISTS product_analytics_user_id_fkey;
ALTER TABLE public.product_analytics ADD CONSTRAINT product_analytics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_interaction_events.user_id -> SET NULL
ALTER TABLE public.user_interaction_events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_interaction_events DROP CONSTRAINT IF EXISTS user_interaction_events_user_id_fkey;
ALTER TABLE public.user_interaction_events ADD CONSTRAINT user_interaction_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- purchase_analytics.user_id -> SET NULL
ALTER TABLE public.purchase_analytics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.purchase_analytics DROP CONSTRAINT IF EXISTS purchase_analytics_user_id_fkey;
ALTER TABLE public.purchase_analytics ADD CONSTRAINT purchase_analytics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- gift_invitation_analytics.user_id -> SET NULL
ALTER TABLE public.gift_invitation_analytics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.gift_invitation_analytics DROP CONSTRAINT IF EXISTS gift_invitation_analytics_user_id_fkey;
ALTER TABLE public.gift_invitation_analytics ADD CONSTRAINT gift_invitation_analytics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- gift_invitation_analytics.invited_user_id -> SET NULL
ALTER TABLE public.gift_invitation_analytics DROP CONSTRAINT IF EXISTS gift_invitation_analytics_invited_user_id_fkey;
ALTER TABLE public.gift_invitation_analytics ADD CONSTRAINT gift_invitation_analytics_invited_user_id_fkey
  FOREIGN KEY (invited_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- invitation_rewards.user_id -> CASCADE
ALTER TABLE public.invitation_rewards DROP CONSTRAINT IF EXISTS invitation_rewards_user_id_fkey;
ALTER TABLE public.invitation_rewards ADD CONSTRAINT invitation_rewards_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- business_admins.user_id -> CASCADE
ALTER TABLE public.business_admins DROP CONSTRAINT IF EXISTS business_admins_user_id_fkey;
ALTER TABLE public.business_admins ADD CONSTRAINT business_admins_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- Part 2: FK constraints on public.orders (so order deletion works)
-- ============================================================

-- automated_gift_executions.order_id -> SET NULL
ALTER TABLE public.automated_gift_executions DROP CONSTRAINT IF EXISTS automated_gift_executions_order_id_fkey;
ALTER TABLE public.automated_gift_executions ADD CONSTRAINT automated_gift_executions_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- admin_alerts.order_id -> SET NULL
ALTER TABLE public.admin_alerts DROP CONSTRAINT IF EXISTS admin_alerts_order_id_fkey;
ALTER TABLE public.admin_alerts ADD CONSTRAINT admin_alerts_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- beta_credits.order_id -> SET NULL
ALTER TABLE public.beta_credits DROP CONSTRAINT IF EXISTS beta_credits_order_id_fkey;
ALTER TABLE public.beta_credits ADD CONSTRAINT beta_credits_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- gift_preview_tokens.order_id -> CASCADE
ALTER TABLE public.gift_preview_tokens DROP CONSTRAINT IF EXISTS gift_preview_tokens_order_id_fkey;
ALTER TABLE public.gift_preview_tokens ADD CONSTRAINT gift_preview_tokens_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- auto_gift_fulfillment_queue.order_id -> SET NULL
ALTER TABLE public.auto_gift_fulfillment_queue DROP CONSTRAINT IF EXISTS auto_gift_fulfillment_queue_order_id_fkey;
ALTER TABLE public.auto_gift_fulfillment_queue ADD CONSTRAINT auto_gift_fulfillment_queue_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- auto_gift_fulfillment_queue.execution_id -> CASCADE
ALTER TABLE public.auto_gift_fulfillment_queue DROP CONSTRAINT IF EXISTS auto_gift_fulfillment_queue_execution_id_fkey;
ALTER TABLE public.auto_gift_fulfillment_queue ADD CONSTRAINT auto_gift_fulfillment_queue_execution_id_fkey
  FOREIGN KEY (execution_id) REFERENCES public.automated_gift_executions(id) ON DELETE CASCADE;

-- auto_gift_payment_audit.execution_id -> CASCADE
ALTER TABLE public.auto_gift_payment_audit DROP CONSTRAINT IF EXISTS auto_gift_payment_audit_execution_id_fkey;
ALTER TABLE public.auto_gift_payment_audit ADD CONSTRAINT auto_gift_payment_audit_execution_id_fkey
  FOREIGN KEY (execution_id) REFERENCES public.automated_gift_executions(id) ON DELETE CASCADE;
