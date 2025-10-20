-- Drop the welcome email trigger since we now handle welcome emails through the onboarding flow
-- This trigger was sending 'user_welcomed' events which no longer exist in the email orchestrator
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;

-- Drop the associated function as it's no longer needed
DROP FUNCTION IF EXISTS public.trigger_welcome_email();