
-- Fix remaining functions to set search_path

CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_bidirectional_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'accepted')) THEN
    INSERT INTO public.user_connections (
      user_id, connected_user_id, status, relationship_type,
      data_access_permissions, created_at, updated_at
    )
    SELECT NEW.connected_user_id, NEW.user_id, NEW.status, NEW.relationship_type,
           '{}'::jsonb, NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_connections
      WHERE user_id = NEW.connected_user_id AND connected_user_id = NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$function$;
