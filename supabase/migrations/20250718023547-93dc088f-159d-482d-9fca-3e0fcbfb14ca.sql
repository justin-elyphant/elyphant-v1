-- Fix the ambiguous column reference in can_cancel_order function
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_status text;
  order_zinc_status text;
BEGIN
  SELECT o.status, o.zinc_status INTO order_status, order_zinc_status
  FROM orders o
  WHERE o.id = order_id AND o.user_id = auth.uid();
  
  -- Can't cancel if order doesn't exist or doesn't belong to user
  IF order_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Can cancel if status is pending, processing, or failed
  -- Cannot cancel if already shipped, delivered, or cancelled
  RETURN order_status IN ('pending', 'processing', 'failed') 
    AND COALESCE(order_zinc_status, '') NOT IN ('shipped', 'delivered', 'cancelled');
END;
$$;