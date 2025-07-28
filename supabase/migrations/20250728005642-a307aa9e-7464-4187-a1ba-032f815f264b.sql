-- Complete remaining database security hardening
-- Fix the final functions that still need search path security

-- Update delete_user_account function
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  user_email TEXT;
  user_avatar TEXT;
  full_name TEXT;
  generated_username TEXT;
  existing_profile_count INTEGER;
BEGIN
  -- Check if profile already exists (to avoid overwriting enhanced profile data)
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.profiles
  WHERE id = NEW.id;
  
  -- If profile already exists, don't overwrite it
  IF existing_profile_count > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Extract email
  user_email := COALESCE(NEW.email, '');
  
  -- Extract names from OAuth metadata with better fallbacks
  user_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), ' ', 1),
    SPLIT_PART(user_email, '@', 1),
    'User'
  );
  
  user_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'family_name',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') LIKE '% %' 
      THEN TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')) + 1))
      ELSE 'Name'
    END
  );
  
  -- Extract avatar URL from OAuth providers (Google, Apple, etc.)
  user_avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'profile_image_url',
    NEW.raw_user_meta_data ->> 'photo'
  );
  
  -- Create full name for backward compatibility
  full_name := TRIM(user_first_name || ' ' || user_last_name);
  
  -- Generate unique username
  generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 6) || '_' || FLOOR(RANDOM() * 1000);
  END LOOP;
  
  -- Insert profile with extracted OAuth data and defaults for required fields
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    name, 
    email, 
    username,
    profile_image,
    birth_year,
    data_sharing_settings
  )
  VALUES (
    NEW.id, 
    user_first_name,
    user_last_name,
    full_name,
    user_email,
    generated_username,
    user_avatar,
    EXTRACT(YEAR FROM NOW()) - 25, -- Default age 25
    jsonb_build_object(
      'dob', 'friends',
      'shipping_address', 'private', 
      'gift_preferences', 'public',
      'email', 'private'
    )
  );
  
  RETURN NEW;
END;
$function$;