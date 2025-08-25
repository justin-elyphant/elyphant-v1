-- Fix generate_invitation_token function to use available functions
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Use gen_random_uuid() and remove dashes to create a 32-character hex token
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$function$;