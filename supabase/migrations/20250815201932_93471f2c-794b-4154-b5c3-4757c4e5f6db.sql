-- Create privacy_settings table to match usePrivacySettings hook expectations
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_connection_requests_from TEXT NOT NULL DEFAULT 'everyone' CHECK (allow_connection_requests_from IN ('everyone', 'friends_only', 'nobody')),
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers_only', 'private')),
  block_list_visibility TEXT NOT NULL DEFAULT 'hidden' CHECK (block_list_visibility IN ('hidden', 'visible_to_friends')),
  show_follower_count BOOLEAN NOT NULL DEFAULT true,
  show_following_count BOOLEAN NOT NULL DEFAULT true,
  allow_message_requests BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for privacy settings
CREATE POLICY "Users can view their own privacy settings"
ON public.privacy_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
ON public.privacy_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
ON public.privacy_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own privacy settings"
ON public.privacy_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_privacy_settings_updated_at
BEFORE UPDATE ON public.privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing profile privacy data to new table
INSERT INTO public.privacy_settings (user_id, profile_visibility, allow_connection_requests_from)
SELECT 
  id,
  CASE 
    WHEN (data_sharing_settings->>'profile_visibility') = 'friends' THEN 'followers_only'
    WHEN (data_sharing_settings->>'profile_visibility') = 'public' THEN 'public'
    ELSE 'private'
  END,
  'everyone'
FROM public.profiles
WHERE id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;