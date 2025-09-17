-- Function to validate webhook tokens securely
CREATE OR REPLACE FUNCTION public.validate_webhook_token(
  order_uuid UUID,
  provided_token TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_uuid 
    AND webhook_token = provided_token
    AND webhook_token IS NOT NULL
  );
END;
$$;