
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_username TEXT,
  p_dob TEXT,
  p_birth_year INT,
  p_interests JSONB,
  p_gift_preferences JSONB,
  p_data_sharing_settings JSONB,
  p_shipping_address JSONB,
  p_profile_image TEXT DEFAULT NULL,
  p_user_type TEXT DEFAULT 'shopper'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, name, username, email, dob, birth_year, interests, gift_preferences, data_sharing_settings, shipping_address, profile_image, user_type, onboarding_completed, updated_at)
  VALUES (p_user_id, p_first_name, p_last_name, p_first_name || ' ' || p_last_name, p_username, p_email, p_dob, p_birth_year, p_interests, p_gift_preferences, p_data_sharing_settings, p_shipping_address, p_profile_image, p_user_type, true, now())
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
    data_sharing_settings = EXCLUDED.data_sharing_settings,
    shipping_address = EXCLUDED.shipping_address,
    profile_image = COALESCE(EXCLUDED.profile_image, profiles.profile_image),
    user_type = EXCLUDED.user_type,
    onboarding_completed = true,
    updated_at = now();

  -- Queue welcome email for the orchestrator
  INSERT INTO email_queue (recipient_email, recipient_name, event_type, template_variables, status, scheduled_for)
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
$$;
