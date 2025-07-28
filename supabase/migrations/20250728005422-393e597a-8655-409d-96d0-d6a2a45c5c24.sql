-- Final security hardening: Fix remaining functions with search path issues
-- Adding SET search_path = '' to remaining functions

-- Update is_group_admin function
CREATE OR REPLACE FUNCTION public.is_group_admin(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id 
    AND role = 'admin'
  );
END;
$function$;

-- Update is_group_member function
CREATE OR REPLACE FUNCTION public.is_group_member(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id
  );
END;
$function$;

-- Update cleanup_failed_orders function
CREATE OR REPLACE FUNCTION public.cleanup_failed_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  updated_count integer;
BEGIN
  -- Mark orders as failed if they've been pending for more than 24 hours
  UPDATE public.orders 
  SET status = 'failed', 
      updated_at = now()
  WHERE status = 'pending' 
    AND created_at < now() - interval '24 hours'
    AND payment_status != 'succeeded';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$function$;

-- Update cancel_order function
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason text DEFAULT 'User cancelled'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_record public.orders%ROWTYPE;
  result json;
BEGIN
  -- Check if order can be cancelled
  IF NOT public.can_cancel_order(order_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order cannot be cancelled in its current state'
    );
  END IF;
  
  -- Get order details
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = order_id AND user_id = auth.uid();
  
  -- Update order status
  UPDATE public.orders 
  SET status = 'cancelled',
      zinc_status = 'cancelled',
      updated_at = now()
  WHERE id = order_id AND user_id = auth.uid();
  
  -- Insert audit log
  INSERT INTO public.order_notes (
    order_id, 
    admin_user_id, 
    note_content, 
    note_type, 
    is_internal
  ) VALUES (
    order_id,
    auth.uid(),
    'Order cancelled by user: ' || cancellation_reason,
    'cancellation',
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order cancelled successfully',
    'order_id', order_id
  );
END;
$function$;

-- Update can_cancel_order function
CREATE OR REPLACE FUNCTION public.can_cancel_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_status text;
  order_zinc_status text;
BEGIN
  SELECT o.status, o.zinc_status INTO order_status, order_zinc_status
  FROM public.orders o
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
$function$;