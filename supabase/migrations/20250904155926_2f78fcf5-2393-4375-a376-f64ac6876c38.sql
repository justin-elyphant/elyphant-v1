-- Fix function search path security issues for new functions
ALTER FUNCTION cleanup_expired_invitation_cache() SET search_path = 'public';

-- Update function header to include proper search_path
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.invitation_context_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;