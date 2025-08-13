-- Add privacy_level column to wishlists in profiles
-- First, let's check the current structure and add the new privacy_level field

-- Add privacy_level column to handle the new 3-level privacy system
-- This will be stored in the profiles.wishlists jsonb field structure

-- Create a function to check if users are connected as friends
CREATE OR REPLACE FUNCTION public.check_friend_connection(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Use the existing are_users_connected function which checks for accepted connections
  RETURN public.are_users_connected(user1_id, user2_id);
END;
$$;

-- Create a function to check wishlist access permissions
CREATE OR REPLACE FUNCTION public.can_access_wishlist(
  wishlist_owner_id uuid, 
  viewer_id uuid, 
  privacy_level text DEFAULT 'private'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Owner can always access their own wishlists
  IF wishlist_owner_id = viewer_id THEN
    RETURN true;
  END IF;
  
  -- Handle different privacy levels
  CASE privacy_level
    WHEN 'public' THEN
      RETURN true;
    WHEN 'friends' THEN
      RETURN public.check_friend_connection(wishlist_owner_id, viewer_id);
    WHEN 'private' THEN
      RETURN false;
    ELSE
      -- Default to private for unknown privacy levels
      RETURN false;
  END CASE;
END;
$$;