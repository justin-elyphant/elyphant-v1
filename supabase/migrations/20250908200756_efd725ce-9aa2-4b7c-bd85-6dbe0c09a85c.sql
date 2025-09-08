-- Fix search path for cart session timestamp function
CREATE OR REPLACE FUNCTION public.update_cart_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';