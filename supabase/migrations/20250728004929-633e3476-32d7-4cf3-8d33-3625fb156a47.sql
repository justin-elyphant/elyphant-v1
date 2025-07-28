-- Security hardening: Fix search path vulnerabilities in database functions
-- Adding SET search_path = '' to all functions to prevent schema injection attacks

-- Update update_presence_timestamp function
CREATE OR REPLACE FUNCTION public.update_presence_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update are_users_connected function
CREATE OR REPLACE FUNCTION public.are_users_connected(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE ((user_id = user_id_1 AND connected_user_id = user_id_2) OR
          (user_id = user_id_2 AND connected_user_id = user_id_1)) AND
          status = 'accepted'
  );
END;
$function$;

-- Update generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

-- Update cleanup_expired_location_cache function
CREATE OR REPLACE FUNCTION public.cleanup_expired_location_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.location_cache WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

-- Update set_order_number function
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update is_user_blocked function
CREATE OR REPLACE FUNCTION public.is_user_blocked(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (blocker_id = user1_id AND blocked_id = user2_id) 
       OR (blocker_id = user2_id AND blocked_id = user1_id)
  );
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;

-- Update set_invitation_token function
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status = 'pending_invitation' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update get_user_privacy_settings function
CREATE OR REPLACE FUNCTION public.get_user_privacy_settings(target_user_id uuid)
RETURNS privacy_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  settings privacy_settings;
BEGIN
  SELECT * INTO settings FROM public.privacy_settings WHERE user_id = target_user_id;
  
  -- Return default settings if none found
  IF NOT FOUND THEN
    settings.user_id := target_user_id;
    settings.allow_follows_from := 'everyone';
    settings.profile_visibility := 'public';
    settings.block_list_visibility := 'hidden';
    settings.show_follower_count := true;
    settings.show_following_count := true;
    settings.allow_message_requests := true;
  END IF;
  
  RETURN settings;
END;
$function$;