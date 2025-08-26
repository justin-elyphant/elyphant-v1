-- Create a function to initialize default auto-gifting settings for users
CREATE OR REPLACE FUNCTION public.initialize_default_auto_gifting_settings(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  settings_id uuid;
BEGIN
  -- Insert default settings if they don't exist
  INSERT INTO public.auto_gifting_settings (
    user_id,
    default_budget_limit,
    default_notification_days,
    email_notifications,
    push_notifications,
    auto_approve_gifts,
    default_gift_source,
    has_payment_method,
    budget_tracking
  ) VALUES (
    target_user_id,
    50,
    ARRAY[7, 3, 1],
    true,
    false,
    false,
    'wishlist',
    false,
    '{"monthly_limit": null, "annual_limit": null, "spent_this_month": 0, "spent_this_year": 0}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO settings_id;
  
  -- If no new record was inserted (due to conflict), get the existing one
  IF settings_id IS NULL THEN
    SELECT id INTO settings_id 
    FROM public.auto_gifting_settings 
    WHERE user_id = target_user_id;
  END IF;
  
  RETURN settings_id;
END;
$function$;

-- Create a trigger function to auto-initialize settings when rules are created
CREATE OR REPLACE FUNCTION public.auto_initialize_settings_on_rule_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if settings exist for this user, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM public.auto_gifting_settings 
    WHERE user_id = NEW.user_id
  ) THEN
    PERFORM public.initialize_default_auto_gifting_settings(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_initialize_settings ON public.auto_gifting_rules;
CREATE TRIGGER trigger_auto_initialize_settings
  AFTER INSERT ON public.auto_gifting_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_initialize_settings_on_rule_creation();

-- Initialize settings for existing users who have rules but no settings
INSERT INTO public.auto_gifting_settings (
  user_id,
  default_budget_limit,
  default_notification_days,
  email_notifications,
  push_notifications,
  auto_approve_gifts,
  default_gift_source,
  has_payment_method,
  budget_tracking
)
SELECT DISTINCT 
  agr.user_id,
  50,
  ARRAY[7, 3, 1],
  true,
  false,
  false,
  'wishlist',
  false,
  '{"monthly_limit": null, "annual_limit": null, "spent_this_month": 0, "spent_this_year": 0}'::jsonb
FROM public.auto_gifting_rules agr
LEFT JOIN public.auto_gifting_settings ags ON agr.user_id = ags.user_id
WHERE ags.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;