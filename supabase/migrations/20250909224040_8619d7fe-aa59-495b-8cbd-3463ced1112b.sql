-- Disable competing welcome email trigger that interferes with verification flow
DROP TRIGGER IF EXISTS profile_welcome_email_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.trigger_welcome_email();