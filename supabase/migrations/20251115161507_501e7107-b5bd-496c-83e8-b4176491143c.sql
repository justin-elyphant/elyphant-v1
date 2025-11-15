-- Phase 2 Completion: Drop 7 Legacy Tables
-- These tables are no longer used by V2 architecture

-- 1. cart_sessions (replaced by checkout sessions in Stripe)
DROP TABLE IF EXISTS public.cart_sessions CASCADE;

-- 2. user_carts (replaced by checkout sessions)
DROP TABLE IF EXISTS public.user_carts CASCADE;

-- 3. payment_intents_cache (not needed with checkout sessions)
DROP TABLE IF EXISTS public.payment_intents_cache CASCADE;

-- 4. payment_verification_audit (consolidated into orders.notes)
DROP TABLE IF EXISTS public.payment_verification_audit CASCADE;

-- 5. order_recovery_logs (consolidated into orders.notes)
DROP TABLE IF EXISTS public.order_recovery_logs CASCADE;

-- 6. order_status_monitoring (handled by order-monitor-v2)
DROP TABLE IF EXISTS public.order_status_monitoring CASCADE;

-- 7. scheduled_order_alerts (handled by scheduled-order-processor)
DROP TABLE IF EXISTS public.scheduled_order_alerts CASCADE;

-- Log completion
COMMENT ON DATABASE postgres IS 'Phase 2 Complete: 7 legacy tables dropped, orders table simplified to 23 columns';