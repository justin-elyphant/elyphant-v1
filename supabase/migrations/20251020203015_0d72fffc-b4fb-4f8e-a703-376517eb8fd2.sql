-- Update delete_user_account to guard optional tables and set safe search_path
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
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
  other_deleted integer := 0;
BEGIN
  -- Verify the user exists and is the same as the authenticated user
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete another user''s account';
  END IF;

  -- 1. Delete wishlist items (references wishlists)
  DELETE FROM public.wishlist_items WHERE wishlist_id IN (
    SELECT id FROM public.wishlists WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS wishlist_items_deleted = ROW_COUNT;

  -- 2. Delete wishlists
  DELETE FROM public.wishlists WHERE user_id = target_user_id;
  GET DIAGNOSTICS wishlists_deleted = ROW_COUNT;

  -- 3. Delete user connections (both directions)
  DELETE FROM public.user_connections 
  WHERE user_id = target_user_id OR connected_user_id = target_user_id;
  GET DIAGNOSTICS connections_deleted = ROW_COUNT;

  -- 4. Delete messages (both sent and received)
  DELETE FROM public.messages 
  WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  GET DIAGNOSTICS messages_deleted = ROW_COUNT;

  -- 5. Delete search history
  DELETE FROM public.user_search_history WHERE user_id = target_user_id;
  GET DIAGNOSTICS search_history_deleted = ROW_COUNT;

  -- 6. Delete special dates
  DELETE FROM public.user_special_dates WHERE user_id = target_user_id;
  GET DIAGNOSTICS special_dates_deleted = ROW_COUNT;

  -- 7. Delete addresses
  DELETE FROM public.user_addresses WHERE user_id = target_user_id;
  GET DIAGNOSTICS addresses_deleted = ROW_COUNT;

  -- 8. Delete privacy settings
  DELETE FROM public.privacy_settings WHERE user_id = target_user_id;
  GET DIAGNOSTICS privacy_settings_deleted = ROW_COUNT;

  -- 9. Delete auto gifting rules and settings
  DELETE FROM public.auto_gifting_rules WHERE user_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.auto_gifting_settings WHERE user_id = target_user_id;
  GET DIAGNOSTICS auto_gifting_deleted = ROW_COUNT;

  -- 10. Delete gift searches and AI searches
  DELETE FROM public.gift_searches WHERE user_id = target_user_id;
  DELETE FROM public.ai_gift_searches WHERE user_id = target_user_id;
  GET DIAGNOSTICS gift_searches_deleted = ROW_COUNT;

  -- 11. Delete contributions
  DELETE FROM public.contributions WHERE contributor_id = target_user_id;
  GET DIAGNOSTICS contributions_deleted = ROW_COUNT;

  -- 12. Delete funding campaigns
  DELETE FROM public.funding_campaigns WHERE creator_id = target_user_id;
  GET DIAGNOSTICS campaigns_deleted = ROW_COUNT;

  -- 13. Delete blocked users records
  DELETE FROM public.blocked_users 
  WHERE blocker_id = target_user_id OR blocked_id = target_user_id;
  GET DIAGNOSTICS blocked_users_deleted = ROW_COUNT;

  -- 14. Delete additional tables that might reference the user
  DELETE FROM public.recipient_profiles WHERE user_id = target_user_id;
  DELETE FROM public.auto_gift_notifications WHERE user_id = target_user_id;
  DELETE FROM public.auto_gift_data_access WHERE user_id = target_user_id OR accessed_user_id = target_user_id;
  DELETE FROM public.automated_gift_executions WHERE user_id = target_user_id;
  DELETE FROM public.approval_conversations WHERE user_id = target_user_id;
  DELETE FROM public.email_approval_tokens WHERE user_id = target_user_id;
  DELETE FROM public.gift_intelligence_cache WHERE user_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.gift_invitation_analytics WHERE user_id = target_user_id OR invited_user_id = target_user_id;
  DELETE FROM public.gift_recommendations WHERE user_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.gift_recommendation_analytics WHERE user_id = target_user_id;
  DELETE FROM public.ai_suggestion_insights WHERE user_id = target_user_id;
  DELETE FROM public.address_intelligence WHERE user_id = target_user_id;
  DELETE FROM public.address_requests WHERE requester_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.connection_nudges WHERE user_id = target_user_id;
  DELETE FROM public.email_preferences WHERE user_id = target_user_id;
  DELETE FROM public.cart_sessions WHERE user_id = target_user_id;
  DELETE FROM public.orders WHERE user_id = target_user_id;
  DELETE FROM public.conversation_threads WHERE user_id = target_user_id;
  DELETE FROM public.message_rate_limits WHERE user_id = target_user_id;
  DELETE FROM public.zma_order_rate_limits WHERE user_id = target_user_id;
  DELETE FROM public.zma_cost_tracking WHERE user_id = target_user_id;
  -- Optional table: delete only if it exists to avoid errors
  IF to_regclass('public.zma_order_validation_cache') IS NOT NULL THEN
    DELETE FROM public.zma_order_validation_cache WHERE user_id = target_user_id;
  END IF;
  DELETE FROM public.security_logs WHERE user_id = target_user_id;
  DELETE FROM public.profile_completion_analytics WHERE user_id = target_user_id;
  GET DIAGNOSTICS other_deleted = ROW_COUNT;

  -- 15. Finally delete the profile (this should be last)
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
      'blocked_users', blocked_users_deleted,
      'other_records', other_deleted
    )
  );

  RETURN deletion_summary;
END;
$$;