-- Phase 3: Anomaly Detection & Risk Scoring
-- Create tables and functions for security anomaly detection

-- 1. Security anomalies table to track detected suspicious activities
CREATE TABLE IF NOT EXISTS public.security_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  anomaly_type TEXT NOT NULL, -- 'device_change', 'location_change', 'unusual_time', 'unusual_frequency', 'concurrent_sessions'
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT valid_anomaly_type CHECK (anomaly_type IN ('device_change', 'location_change', 'unusual_time', 'unusual_frequency', 'concurrent_sessions', 'failed_login_attempts'))
);

-- Enable RLS
ALTER TABLE public.security_anomalies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_anomalies
CREATE POLICY "Users can view their own anomalies"
  ON public.security_anomalies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert anomalies"
  ON public.security_anomalies
  FOR INSERT
  WITH CHECK (true); -- Edge functions will insert with service role

CREATE POLICY "Users can update their own anomalies"
  ON public.security_anomalies
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_security_anomalies_user_id ON public.security_anomalies(user_id);
CREATE INDEX idx_security_anomalies_session_id ON public.security_anomalies(session_id);
CREATE INDEX idx_security_anomalies_created_at ON public.security_anomalies(created_at DESC);
CREATE INDEX idx_security_anomalies_resolved ON public.security_anomalies(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_security_anomalies_risk_score ON public.security_anomalies(risk_score DESC);

-- 2. User notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  device_change_alerts BOOLEAN DEFAULT TRUE,
  location_change_alerts BOOLEAN DEFAULT TRUE,
  suspicious_activity_alerts BOOLEAN DEFAULT TRUE,
  new_session_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);

-- 3. Function to calculate risk score based on anomaly factors
CREATE OR REPLACE FUNCTION public.calculate_risk_score(
  anomaly_type_param TEXT,
  details_param JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_score INTEGER := 0;
BEGIN
  -- Base scores for different anomaly types
  CASE anomaly_type_param
    WHEN 'device_change' THEN base_score := 60;
    WHEN 'location_change' THEN base_score := 40;
    WHEN 'unusual_time' THEN base_score := 20;
    WHEN 'unusual_frequency' THEN base_score := 30;
    WHEN 'concurrent_sessions' THEN base_score := 50;
    WHEN 'failed_login_attempts' THEN base_score := 70;
    ELSE base_score := 10;
  END CASE;

  -- Adjust score based on additional factors
  IF details_param->>'is_vpn' = 'true' THEN
    base_score := base_score + 10;
  END IF;

  IF details_param->>'time_since_last_login' IS NOT NULL THEN
    IF (details_param->>'time_since_last_login')::INTEGER > 30 THEN
      base_score := base_score + 15;
    END IF;
  END IF;

  -- Cap at 100
  IF base_score > 100 THEN
    base_score := 100;
  END IF;

  RETURN base_score;
END;
$$;

-- 4. Function to get user's active anomalies
CREATE OR REPLACE FUNCTION public.get_user_active_anomalies(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  anomaly_type TEXT,
  risk_score INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.anomaly_type,
    sa.risk_score,
    sa.details,
    sa.created_at
  FROM public.security_anomalies sa
  WHERE sa.user_id = target_user_id
    AND sa.resolved = FALSE
    AND sa.created_at > NOW() - INTERVAL '7 days'
  ORDER BY sa.risk_score DESC, sa.created_at DESC;
END;
$$;

-- 5. Function to resolve anomaly
CREATE OR REPLACE FUNCTION public.resolve_anomaly(anomaly_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.security_anomalies
  SET 
    resolved = TRUE,
    resolved_at = NOW()
  WHERE id = anomaly_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- 6. Trigger to update updated_at on notification preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notification_preferences_updated_at_trigger
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();