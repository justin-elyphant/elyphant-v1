-- Drop legacy integer overload of process_auto_approved_referral.
-- The edge function passes credit_amount as 100 (integer-typed from JS), which
-- causes Postgres overload resolution to select the OLD function that:
--   * Ignores seeder detection
--   * Issues BOTH welcome ($100) and referrer_reward ($100) per referral
--   * Doesn't enforce the 2-invite cap
-- Removing it forces all calls to the new numeric version with seeder + cap logic.
DROP FUNCTION IF EXISTS public.process_auto_approved_referral(uuid, integer);