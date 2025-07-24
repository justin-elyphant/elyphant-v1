-- Customer Analytics Foundation Schema
-- Create analytics tables with RLS protection

-- Product analytics table for tracking product interactions
CREATE TABLE public.product_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'click', 'add_to_cart', 'purchase', 'wishlist'
  event_data JSONB DEFAULT '{}',
  source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User interaction events for behavior tracking
CREATE TABLE public.user_interaction_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'search', 'filter', 'sort', 'page_view', 'session_start'
  event_data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Popularity scores for dynamic badge calculation
CREATE TABLE public.popularity_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  zinc_score NUMERIC DEFAULT 0, -- Score from Zinc API data
  customer_score NUMERIC DEFAULT 0, -- Score from customer behavior
  engagement_score NUMERIC DEFAULT 0, -- Views, clicks, time spent
  purchase_score NUMERIC DEFAULT 0, -- Purchase volume and frequency
  trending_score NUMERIC DEFAULT 0, -- Recent activity boost
  final_score NUMERIC GENERATED ALWAYS AS (
    (COALESCE(zinc_score, 0) * 0.3) + 
    (COALESCE(customer_score, 0) * 0.4) + 
    (COALESCE(engagement_score, 0) * 0.2) + 
    (COALESCE(trending_score, 0) * 0.1)
  ) STORED,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase analytics for tracking actual purchases
CREATE TABLE public.purchase_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  order_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  purchase_source TEXT DEFAULT 'direct', -- 'direct', 'wishlist', 'recommendation'
  conversion_path JSONB DEFAULT '{}', -- Track user journey to purchase
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_product_analytics_product_user ON public.product_analytics(product_id, user_id);
CREATE INDEX idx_product_analytics_event_type ON public.product_analytics(event_type);
CREATE INDEX idx_product_analytics_created_at ON public.product_analytics(created_at);
CREATE INDEX idx_user_interaction_events_user_id ON public.user_interaction_events(user_id);
CREATE INDEX idx_user_interaction_events_event_type ON public.user_interaction_events(event_type);
CREATE INDEX idx_user_interaction_events_created_at ON public.user_interaction_events(created_at);
CREATE INDEX idx_popularity_scores_product_id ON public.popularity_scores(product_id);
CREATE INDEX idx_popularity_scores_final_score ON public.popularity_scores(final_score DESC);
CREATE INDEX idx_purchase_analytics_user_product ON public.purchase_analytics(user_id, product_id);
CREATE INDEX idx_purchase_analytics_created_at ON public.purchase_analytics(created_at);

-- Enable RLS on all analytics tables
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popularity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_analytics
CREATE POLICY "Users can insert their own product analytics" 
ON public.product_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own product analytics" 
ON public.product_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can view aggregated product analytics" 
ON public.product_analytics 
FOR SELECT 
USING (true);

-- RLS Policies for user_interaction_events
CREATE POLICY "Users can insert their own interaction events" 
ON public.user_interaction_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interaction events" 
ON public.user_interaction_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for popularity_scores (read-only for users)
CREATE POLICY "Anyone can view popularity scores" 
ON public.popularity_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage popularity scores" 
ON public.popularity_scores 
FOR ALL 
USING (true);

-- RLS Policies for purchase_analytics
CREATE POLICY "Users can insert their own purchase analytics" 
ON public.purchase_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own purchase analytics" 
ON public.purchase_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to update popularity scores
CREATE OR REPLACE FUNCTION public.update_popularity_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update popularity score when new analytics data is added
  INSERT INTO public.popularity_scores (product_id, customer_score, engagement_score)
  VALUES (NEW.product_id, 1, CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END)
  ON CONFLICT (product_id) DO UPDATE SET
    customer_score = popularity_scores.customer_score + 1,
    engagement_score = popularity_scores.engagement_score + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update popularity scores
CREATE TRIGGER update_popularity_on_analytics
  AFTER INSERT ON public.product_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_popularity_scores();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on popularity_scores
CREATE TRIGGER update_popularity_scores_updated_at
  BEFORE UPDATE ON public.popularity_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_analytics_updated_at();