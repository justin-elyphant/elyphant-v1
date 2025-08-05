-- Phase 6: Analytics & Optimization Framework
-- Create tables for tracking invitation success and conversion metrics

-- Invitation analytics tracking
CREATE TABLE IF NOT EXISTS public.gift_invitation_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'friend',
  occasion TEXT,
  invitation_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_opened_at TIMESTAMP WITH TIME ZONE,
  email_clicked_at TIMESTAMP WITH TIME ZONE,
  signup_completed_at TIMESTAMP WITH TIME ZONE,
  profile_completed_at TIMESTAMP WITH TIME ZONE,
  auto_gift_activated_at TIMESTAMP WITH TIME ZONE,
  conversion_status TEXT NOT NULL DEFAULT 'sent' CHECK (conversion_status IN ('sent', 'opened', 'clicked', 'signed_up', 'profile_completed', 'auto_gift_active')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_user_id ON public.gift_invitation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_recipient_email ON public.gift_invitation_analytics(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_conversion_status ON public.gift_invitation_analytics(conversion_status);
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_sent_at ON public.gift_invitation_analytics(invitation_sent_at);

-- Invitation conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.invitation_conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.gift_invitation_analytics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_sent', 'email_opened', 'email_clicked', 'signup_started', 'signup_completed', 'profile_setup_started', 'profile_setup_completed', 'preference_collection_started', 'preference_collection_completed', 'auto_gift_activated')),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_conversion_events_invitation_id ON public.invitation_conversion_events(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_conversion_events_type ON public.invitation_conversion_events(event_type);

-- Viral mechanics tracking
CREATE TABLE IF NOT EXISTS public.invitation_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES public.gift_invitation_analytics(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('referral_bonus', 'premium_unlock', 'free_auto_gift', 'community_badge')),
  reward_value NUMERIC DEFAULT 0,
  reward_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_rewards_user_id ON public.invitation_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_rewards_invitation_id ON public.invitation_rewards(invitation_id);

-- Enable RLS
ALTER TABLE public.gift_invitation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_invitation_analytics
CREATE POLICY "Users can view their own invitation analytics" 
ON public.gift_invitation_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invitation analytics" 
ON public.gift_invitation_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitation analytics" 
ON public.gift_invitation_analytics FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for invitation_conversion_events
CREATE POLICY "Users can view conversion events for their invitations" 
ON public.invitation_conversion_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.gift_invitation_analytics 
    WHERE id = invitation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert conversion events for their invitations" 
ON public.invitation_conversion_events FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gift_invitation_analytics 
    WHERE id = invitation_id AND user_id = auth.uid()
  )
);

-- RLS Policies for invitation_rewards
CREATE POLICY "Users can view their own invitation rewards" 
ON public.invitation_rewards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invitation rewards" 
ON public.invitation_rewards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_gift_invitation_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gift_invitation_analytics_updated_at
  BEFORE UPDATE ON public.gift_invitation_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_gift_invitation_analytics_updated_at();

-- Function to update conversion status based on events
CREATE OR REPLACE FUNCTION public.update_invitation_conversion_status()
RETURNS TRIGGER AS $$
DECLARE
  new_status TEXT;
BEGIN
  -- Determine new status based on event type
  CASE NEW.event_type
    WHEN 'email_opened' THEN new_status := 'opened';
    WHEN 'email_clicked' THEN new_status := 'clicked';
    WHEN 'signup_completed' THEN new_status := 'signed_up';
    WHEN 'profile_setup_completed' THEN new_status := 'profile_completed';
    WHEN 'auto_gift_activated' THEN new_status := 'auto_gift_active';
    ELSE new_status := NULL;
  END CASE;

  -- Update analytics record if status should be updated
  IF new_status IS NOT NULL THEN
    UPDATE public.gift_invitation_analytics 
    SET 
      conversion_status = new_status,
      updated_at = now(),
      email_opened_at = CASE WHEN NEW.event_type = 'email_opened' THEN NEW.created_at ELSE email_opened_at END,
      email_clicked_at = CASE WHEN NEW.event_type = 'email_clicked' THEN NEW.created_at ELSE email_clicked_at END,
      signup_completed_at = CASE WHEN NEW.event_type = 'signup_completed' THEN NEW.created_at ELSE signup_completed_at END,
      profile_completed_at = CASE WHEN NEW.event_type = 'profile_setup_completed' THEN NEW.created_at ELSE profile_completed_at END,
      auto_gift_activated_at = CASE WHEN NEW.event_type = 'auto_gift_activated' THEN NEW.created_at ELSE auto_gift_activated_at END
    WHERE id = NEW.invitation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_invitation_conversion_status_trigger
  AFTER INSERT ON public.invitation_conversion_events
  FOR EACH ROW EXECUTE FUNCTION public.update_invitation_conversion_status();