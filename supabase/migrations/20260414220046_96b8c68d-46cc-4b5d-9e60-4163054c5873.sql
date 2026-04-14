-- Fix link_pending_auto_gift_rules: schema-qualify all table references
CREATE OR REPLACE FUNCTION public.link_pending_auto_gift_rules()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.user_connections
  SET 
    connected_user_id = NEW.id,
    status = 'accepted',
    relationship_type = 'friend',
    pending_recipient_email = NULL,
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND status = 'pending_invitation'
    AND connected_user_id IS NULL;

  INSERT INTO public.user_connections (
    user_id,
    connected_user_id,
    status,
    relationship_type,
    accepted_at,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    user_id,
    'accepted',
    'friend',
    NOW(),
    NOW(),
    NOW()
  FROM public.user_connections
  WHERE 
    connected_user_id = NEW.id
    AND status = 'accepted'
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;

  UPDATE public.auto_gifting_rules
  SET 
    recipient_id = NEW.id,
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    pending_recipient_email = NEW.email
    AND recipient_id IS NULL;

  RETURN NEW;
END;
$function$;

-- Fix complete_onboarding: schema-qualify all table/type references
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_username text,
  p_dob text,
  p_birth_year integer,
  p_interests jsonb,
  p_gift_preferences jsonb,
  p_shipping_address jsonb,
  p_profile_image text DEFAULT NULL::text,
  p_user_type text DEFAULT 'shopper'::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, name, username, email, dob, birth_year, interests, gift_preferences, shipping_address, profile_image, user_type, onboarding_completed, updated_at)
  VALUES (p_user_id, p_first_name, p_last_name, p_first_name || ' ' || p_last_name, p_username, p_email, p_dob, p_birth_year, p_interests, p_gift_preferences, p_shipping_address, p_profile_image, p_user_type::public.user_type, true, now())
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    dob = EXCLUDED.dob,
    birth_year = EXCLUDED.birth_year,
    interests = EXCLUDED.interests,
    gift_preferences = EXCLUDED.gift_preferences,
    shipping_address = EXCLUDED.shipping_address,
    profile_image = COALESCE(EXCLUDED.profile_image, public.profiles.profile_image),
    user_type = EXCLUDED.user_type,
    onboarding_completed = true,
    updated_at = now();

  INSERT INTO public.email_queue (recipient_email, recipient_name, event_type, template_variables, status, scheduled_for)
  VALUES (
    p_email,
    p_first_name,
    'welcome_email',
    jsonb_build_object('first_name', p_first_name, 'email', p_email, 'gifting_url', 'https://elyphant.ai'),
    'pending',
    now()
  );

  RETURN true;
END;
$function$;