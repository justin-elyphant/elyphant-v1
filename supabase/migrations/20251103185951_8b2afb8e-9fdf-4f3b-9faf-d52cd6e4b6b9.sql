-- Fix search_path for session management functions

ALTER FUNCTION public.update_session_activity() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public;
ALTER FUNCTION public.get_active_session_count(uuid) SET search_path = public;
ALTER FUNCTION public.terminate_other_sessions(uuid, text) SET search_path = public;
ALTER FUNCTION public.terminate_session(uuid) SET search_path = public;