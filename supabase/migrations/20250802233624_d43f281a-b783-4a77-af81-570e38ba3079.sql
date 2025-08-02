-- ZMA Order Rate Limiting and Security Tables

-- ZMA order rate limits table
CREATE TABLE public.zma_order_rate_limits (
  user_id UUID NOT NULL PRIMARY KEY,
  orders_today INTEGER DEFAULT 0,
  orders_this_hour INTEGER DEFAULT 0,
  last_order_date DATE DEFAULT CURRENT_DATE,
  last_order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_rate_limited BOOLEAN DEFAULT FALSE,
  rate_limit_expires_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ZMA cost tracking table
CREATE TABLE public.zma_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  cost_amount NUMERIC(10,2) NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'order', -- 'order', 'api_call', 'retry'
  daily_total NUMERIC(10,2) DEFAULT 0,
  monthly_total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ZMA security events table
CREATE TABLE public.zma_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  event_type TEXT NOT NULL, -- 'rate_limit', 'suspicious_order', 'cost_limit', 'retry_abuse'
  event_data JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ZMA order validation cache
CREATE TABLE public.zma_order_validation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_hash TEXT NOT NULL, -- Hash of order details for duplicate detection
  order_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Enable RLS for all tables
ALTER TABLE public.zma_order_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zma_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zma_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zma_order_validation_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zma_order_rate_limits
CREATE POLICY "Users can view their own ZMA rate limits"
ON public.zma_order_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage ZMA rate limits"
ON public.zma_order_rate_limits
FOR ALL
USING (true);

-- RLS Policies for zma_cost_tracking
CREATE POLICY "Users can view their own ZMA costs"
ON public.zma_cost_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert ZMA cost tracking"
ON public.zma_cost_tracking
FOR INSERT
WITH CHECK (true);

-- RLS Policies for zma_security_events
CREATE POLICY "Users can view their own ZMA security events"
ON public.zma_security_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage ZMA security events"
ON public.zma_security_events
FOR ALL
USING (true);

-- RLS Policies for zma_order_validation_cache
CREATE POLICY "Users can view their own ZMA validation cache"
ON public.zma_order_validation_cache
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage ZMA validation cache"
ON public.zma_order_validation_cache
FOR ALL
USING (true);

-- Function to check ZMA order rate limits
CREATE OR REPLACE FUNCTION public.check_zma_order_rate_limit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  daily_limit INTEGER := 50;  -- 50 orders per day
  hourly_limit INTEGER := 10; -- 10 orders per hour
  current_daily_count INTEGER;
  current_hourly_count INTEGER;
  is_limited BOOLEAN := false;
BEGIN
  -- Insert or update rate limit record
  INSERT INTO public.zma_order_rate_limits (user_id, orders_today, orders_this_hour, last_order_date, last_order_time)
  VALUES (user_uuid, 1, 1, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    orders_today = CASE 
      WHEN public.zma_order_rate_limits.last_order_date < CURRENT_DATE THEN 1
      ELSE public.zma_order_rate_limits.orders_today + 1
    END,
    orders_this_hour = CASE
      WHEN public.zma_order_rate_limits.last_order_time < (NOW() - INTERVAL '1 hour') THEN 1
      ELSE public.zma_order_rate_limits.orders_this_hour + 1
    END,
    last_order_date = CURRENT_DATE,
    last_order_time = NOW(),
    updated_at = NOW();

  -- Get current counts
  SELECT orders_today, orders_this_hour INTO current_daily_count, current_hourly_count
  FROM public.zma_order_rate_limits
  WHERE user_id = user_uuid;

  -- Apply rate limiting
  IF current_daily_count > daily_limit OR current_hourly_count > hourly_limit THEN
    UPDATE public.zma_order_rate_limits 
    SET is_rate_limited = true,
        rate_limit_expires_at = CASE 
          WHEN current_hourly_count > hourly_limit THEN NOW() + INTERVAL '1 hour'
          ELSE NOW() + INTERVAL '1 day'
        END
    WHERE user_id = user_uuid;
    is_limited := true;
  END IF;

  RETURN NOT is_limited;
END;
$function$;

-- Function to track ZMA costs
CREATE OR REPLACE FUNCTION public.track_zma_cost(
  user_uuid UUID,
  order_uuid UUID,
  cost NUMERIC,
  cost_type_param TEXT DEFAULT 'order'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  daily_total NUMERIC;
  monthly_total NUMERIC;
BEGIN
  -- Calculate totals for today and this month
  SELECT 
    COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN cost_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN cost_amount ELSE 0 END), 0)
  INTO daily_total, monthly_total
  FROM public.zma_cost_tracking
  WHERE user_id = user_uuid;

  -- Insert new cost record
  INSERT INTO public.zma_cost_tracking (
    user_id, order_id, cost_amount, cost_type, daily_total, monthly_total
  ) VALUES (
    user_uuid, order_uuid, cost, cost_type_param, daily_total + cost, monthly_total + cost
  );
END;
$function$;

-- Function to validate ZMA order for duplicates and suspicious patterns
CREATE OR REPLACE FUNCTION public.validate_zma_order(
  user_uuid UUID,
  order_hash_param TEXT,
  order_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  duplicate_count INTEGER;
  recent_high_value_count INTEGER;
  validation_result JSONB;
BEGIN
  -- Check for duplicate orders in the last hour
  SELECT COUNT(*) INTO duplicate_count
  FROM public.zma_order_validation_cache
  WHERE user_id = user_uuid 
    AND order_hash = order_hash_param
    AND created_at > (NOW() - INTERVAL '1 hour');

  -- Check for multiple high-value orders (>$200) in the last 6 hours
  SELECT COUNT(*) INTO recent_high_value_count
  FROM public.zma_order_validation_cache
  WHERE user_id = user_uuid
    AND order_amount > 200
    AND created_at > (NOW() - INTERVAL '6 hours');

  -- Insert validation record
  INSERT INTO public.zma_order_validation_cache (
    user_id, order_hash, order_amount
  ) VALUES (
    user_uuid, order_hash_param, order_amount
  );

  -- Build validation result
  validation_result := jsonb_build_object(
    'is_valid', (duplicate_count = 0 AND recent_high_value_count < 3),
    'is_duplicate', duplicate_count > 0,
    'is_suspicious_pattern', recent_high_value_count >= 3,
    'duplicate_count', duplicate_count,
    'recent_high_value_count', recent_high_value_count
  );

  RETURN validation_result;
END;
$function$;

-- Function to cleanup expired validation cache
CREATE OR REPLACE FUNCTION public.cleanup_zma_validation_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.zma_order_validation_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Indexes for performance
CREATE INDEX idx_zma_rate_limits_user_id ON public.zma_order_rate_limits(user_id);
CREATE INDEX idx_zma_cost_tracking_user_date ON public.zma_cost_tracking(user_id, created_at);
CREATE INDEX idx_zma_security_events_user_type ON public.zma_security_events(user_id, event_type);
CREATE INDEX idx_zma_validation_cache_user_hash ON public.zma_order_validation_cache(user_id, order_hash);
CREATE INDEX idx_zma_validation_cache_expires ON public.zma_order_validation_cache(expires_at);