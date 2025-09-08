-- Manually recreate the triggers that failed to create
DROP TRIGGER IF EXISTS order_email_trigger ON public.orders;
DROP TRIGGER IF EXISTS profile_welcome_email_trigger ON public.profiles;

-- Recreate order email trigger
CREATE TRIGGER order_email_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_emails();

-- Recreate profile welcome email trigger  
CREATE TRIGGER profile_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();