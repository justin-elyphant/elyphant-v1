-- Enhanced Gift Recommendation System Tables

-- Create enhanced product recommendations table
CREATE TABLE IF NOT EXISTS public.gift_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipient_id UUID NULL, -- Can be NULL for non-connected recipients
  search_context JSONB NOT NULL DEFAULT '{}', -- Context from Nicole conversation
  recommendation_data JSONB NOT NULL DEFAULT '{}', -- AI-generated recommendations
  confidence_score NUMERIC(3,2) DEFAULT 0.00, -- 0.00 to 1.00
  recommendation_source TEXT DEFAULT 'ai_analysis', -- 'ai_analysis', 'wishlist_match', 'pattern_analysis'
  status TEXT DEFAULT 'active', -- 'active', 'selected', 'dismissed', 'purchased'
  execution_id UUID NULL, -- Link to automated_gift_executions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create gift recommendation analytics table
CREATE TABLE IF NOT EXISTS public.gift_recommendation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'viewed', 'clicked', 'dismissed', 'purchased', 'recipient_feedback'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recipient intelligence profiles (for non-SMS data collection)
CREATE TABLE IF NOT EXISTS public.recipient_intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- The gift giver
  recipient_identifier TEXT NOT NULL, -- Email, phone, or name
  profile_data JSONB NOT NULL DEFAULT '{}', -- Collected intelligence
  data_sources JSONB DEFAULT '{"sources": [], "collection_methods": []}', -- Track data sources
  confidence_level NUMERIC(3,2) DEFAULT 0.00,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipient_identifier)
);

-- Enable RLS
ALTER TABLE public.gift_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_intelligence_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_recommendations
CREATE POLICY "Users can manage their own gift recommendations"
  ON public.gift_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for gift_recommendation_analytics  
CREATE POLICY "Users can view their own recommendation analytics"
  ON public.gift_recommendation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendation analytics"
  ON public.gift_recommendation_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for recipient_intelligence_profiles
CREATE POLICY "Users can manage their own recipient profiles"
  ON public.recipient_intelligence_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_recommendations_user_status 
  ON public.gift_recommendations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_gift_recommendations_execution 
  ON public.gift_recommendations(execution_id) WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_recommendation 
  ON public.gift_recommendation_analytics(recommendation_id, event_type);

CREATE INDEX IF NOT EXISTS idx_recipient_profiles_user_identifier 
  ON public.recipient_intelligence_profiles(user_id, recipient_identifier);

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_gift_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gift_recommendations_updated_at
  BEFORE UPDATE ON public.gift_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_gift_recommendations_updated_at();

CREATE TRIGGER update_recipient_profiles_updated_at
  BEFORE UPDATE ON public.recipient_intelligence_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();