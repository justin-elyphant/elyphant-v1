-- CRITICAL SECURITY FIX: Fix API Keys Table Permissions
-- Remove overly permissive policy that allows any user to modify all API keys
DROP POLICY IF EXISTS "Role for all users to modify currently" ON public.api_keys;

-- Create secure RLS policies for API keys
-- Only allow users to view/modify their own API keys
CREATE POLICY "Users can manage their own API keys" 
ON public.api_keys 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add user_id column to api_keys table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'api_keys' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.api_keys ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing API keys to have a user_id (this is a one-time migration)
-- Note: In production, you'd need to assign these to appropriate users
UPDATE public.api_keys SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after assigning values
ALTER TABLE public.api_keys ALTER COLUMN user_id SET NOT NULL;

-- Update the policy to use user_id for proper isolation
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can manage their own API keys" 
ON public.api_keys 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SECURITY FIX: Add SET search_path TO '' to all functions for security
-- This prevents search path manipulation attacks

-- Fix function: are_users_connected
CREATE OR REPLACE FUNCTION public.are_users_connected(user_id_1 uuid, user_id_2 uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix function: is_user_blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(user1_id uuid, user2_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (blocker_id = user1_id AND blocked_id = user2_id) 
       OR (blocker_id = user2_id AND blocked_id = user1_id)
  );
END;
$function$;

-- Fix function: get_user_privacy_settings
CREATE OR REPLACE FUNCTION public.get_user_privacy_settings(target_user_id uuid)
 RETURNS privacy_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  settings public.privacy_settings;
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