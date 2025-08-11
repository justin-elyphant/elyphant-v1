-- Fix remaining database functions with search_path security
-- Add SET search_path TO '' to all remaining vulnerable functions

-- Fix function: generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

-- Fix function: generate_invitation_token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;

-- Fix function: cleanup_expired_location_cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_location_cache()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.location_cache WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

-- Fix function: set_invitation_token
CREATE OR REPLACE FUNCTION public.set_invitation_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.status = 'pending_invitation' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix function: set_order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix function: update_gift_invitation_analytics_updated_at
CREATE OR REPLACE FUNCTION public.update_gift_invitation_analytics_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_gift_recommendations_updated_at
CREATE OR REPLACE FUNCTION public.update_gift_recommendations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_nicole_discovery_updated_at
CREATE OR REPLACE FUNCTION public.update_nicole_discovery_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_presence_timestamp
CREATE OR REPLACE FUNCTION public.update_presence_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;