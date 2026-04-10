
-- Prevent users from modifying their own user_type (privilege escalation)
CREATE OR REPLACE FUNCTION public.protect_user_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allow service_role to make any changes
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive role/type columns
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    NEW.user_type := OLD.user_type;
  END IF;
  IF OLD.signup_source IS DISTINCT FROM NEW.signup_source THEN
    NEW.signup_source := OLD.signup_source;
  END IF;
  IF OLD.signup_metadata IS DISTINCT FROM NEW.signup_metadata THEN
    NEW.signup_metadata := OLD.signup_metadata;
  END IF;
  IF OLD.source_attribution IS DISTINCT FROM NEW.source_attribution THEN
    NEW.source_attribution := OLD.source_attribution;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_user_type_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_type_change();
