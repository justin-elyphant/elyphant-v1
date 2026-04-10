
-- Fix: Set the view to use SECURITY INVOKER (the default, but explicit is better)
ALTER VIEW public.profiles_discoverable SET (security_invoker = on);
