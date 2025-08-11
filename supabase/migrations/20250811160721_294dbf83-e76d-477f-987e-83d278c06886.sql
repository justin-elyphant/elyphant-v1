-- Fix remaining functions with search_path security
-- Continue with the remaining functions that need SET search_path TO ''

-- Fix function: cancel_order
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason text DEFAULT 'User cancelled'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix function: cleanup_failed_orders
CREATE OR REPLACE FUNCTION public.cleanup_failed_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix function: delete_user_account
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  deletion_summary json;
  profiles_deleted integer := 0;
  wishlists_deleted integer := 0;
  wishlist_items_deleted integer := 0;
  connections_deleted integer := 0;
  messages_deleted integer := 0;
  search_history_deleted integer := 0;
  special_dates_deleted integer := 0;
  addresses_deleted integer := 0;
  privacy_settings_deleted integer := 0;
  auto_gifting_deleted integer := 0;
  gift_searches_deleted integer := 0;
  contributions_deleted integer := 0;
  campaigns_deleted integer := 0;
  blocked_users_deleted integer := 0;
BEGIN
  -- Verify the user exists and is the same as the authenticated user
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete another user''s account';
  END IF;

  -- Delete from all related tables (order matters due to foreign keys)
  
  -- Delete wishlist items first (references wishlists)
  DELETE FROM public.wishlist_items WHERE wishlist_id IN (
    SELECT id FROM public.wishlists WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS wishlist_items_deleted = ROW_COUNT;
  
  -- Delete wishlists
  DELETE FROM public.wishlists WHERE user_id = target_user_id;
  GET DIAGNOSTICS wishlists_deleted = ROW_COUNT;
  
  -- Delete user connections (both directions)
  DELETE FROM public.user_connections 
  WHERE user_id = target_user_id OR connected_user_id = target_user_id;
  GET DIAGNOSTICS connections_deleted = ROW_COUNT;
  
  -- Delete messages (both sent and received)
  DELETE FROM public.messages 
  WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  GET DIAGNOSTICS messages_deleted = ROW_COUNT;
  
  -- Delete search history
  DELETE FROM public.user_search_history WHERE user_id = target_user_id;
  GET DIAGNOSTICS search_history_deleted = ROW_COUNT;
  
  -- Delete special dates
  DELETE FROM public.user_special_dates WHERE user_id = target_user_id;
  GET DIAGNOSTICS special_dates_deleted = ROW_COUNT;
  
  -- Delete addresses
  DELETE FROM public.user_addresses WHERE user_id = target_user_id;
  GET DIAGNOSTICS addresses_deleted = ROW_COUNT;
  
  -- Delete privacy settings
  DELETE FROM public.privacy_settings WHERE user_id = target_user_id;
  GET DIAGNOSTICS privacy_settings_deleted = ROW_COUNT;
  
  -- Delete auto gifting settings and rules
  DELETE FROM public.auto_gifting_rules WHERE user_id = target_user_id;
  DELETE FROM public.auto_gifting_settings WHERE user_id = target_user_id;
  GET DIAGNOSTICS auto_gifting_deleted = ROW_COUNT;
  
  -- Delete gift searches
  DELETE FROM public.gift_searches WHERE user_id = target_user_id;
  DELETE FROM public.ai_gift_searches WHERE user_id = target_user_id;
  GET DIAGNOSTICS gift_searches_deleted = ROW_COUNT;
  
  -- Delete contributions
  DELETE FROM public.contributions WHERE contributor_id = target_user_id;
  GET DIAGNOSTICS contributions_deleted = ROW_COUNT;
  
  -- Delete funding campaigns
  DELETE FROM public.funding_campaigns WHERE creator_id = target_user_id;
  GET DIAGNOSTICS campaigns_deleted = ROW_COUNT;
  
  -- Delete blocked users records
  DELETE FROM public.blocked_users 
  WHERE blocker_id = target_user_id OR blocked_id = target_user_id;
  GET DIAGNOSTICS blocked_users_deleted = ROW_COUNT;
  
  -- Delete recipient profiles
  DELETE FROM public.recipient_profiles WHERE user_id = target_user_id;
  
  -- Finally delete the profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS profiles_deleted = ROW_COUNT;
  
  -- Create summary of deletion
  deletion_summary := json_build_object(
    'user_id', target_user_id,
    'deleted_at', now(),
    'summary', json_build_object(
      'profiles', profiles_deleted,
      'wishlists', wishlists_deleted,
      'wishlist_items', wishlist_items_deleted,
      'connections', connections_deleted,
      'messages', messages_deleted,
      'search_history', search_history_deleted,
      'special_dates', special_dates_deleted,
      'addresses', addresses_deleted,
      'privacy_settings', privacy_settings_deleted,
      'auto_gifting', auto_gifting_deleted,
      'gift_searches', gift_searches_deleted,
      'contributions', contributions_deleted,
      'campaigns', campaigns_deleted,
      'blocked_users', blocked_users_deleted
    )
  );
  
  RETURN deletion_summary;
END;
$function$;