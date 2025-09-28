-- Create auto-gift event tracking table for comprehensive audit trail
CREATE TABLE public.auto_gift_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  setup_token TEXT,
  rule_id UUID,
  execution_id UUID,
  event_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for auto-gift event logs
ALTER TABLE public.auto_gift_event_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own event logs
CREATE POLICY "Users can view their own auto-gift event logs"
ON public.auto_gift_event_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert event logs
CREATE POLICY "System can insert auto-gift event logs"
ON public.auto_gift_event_logs
FOR INSERT
WITH CHECK (true);

-- Add setup_token column to auto_gifting_rules for secure setup process
ALTER TABLE public.auto_gifting_rules 
ADD COLUMN setup_token TEXT,
ADD COLUMN setup_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN setup_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient event log queries
CREATE INDEX idx_auto_gift_event_logs_user_id_created_at 
ON public.auto_gift_event_logs(user_id, created_at DESC);

CREATE INDEX idx_auto_gift_event_logs_rule_id 
ON public.auto_gift_event_logs(rule_id) WHERE rule_id IS NOT NULL;

CREATE INDEX idx_auto_gift_event_logs_execution_id 
ON public.auto_gift_event_logs(execution_id) WHERE execution_id IS NOT NULL;

-- Add index for setup tokens
CREATE INDEX idx_auto_gifting_rules_setup_token 
ON public.auto_gifting_rules(setup_token) WHERE setup_token IS NOT NULL;

-- Add function to validate setup tokens
CREATE OR REPLACE FUNCTION public.validate_auto_gift_setup_token(
  token TEXT,
  user_uuid UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.auto_gifting_rules
    WHERE setup_token = token 
    AND user_id = user_uuid
    AND setup_expires_at > NOW()
    AND setup_completed_at IS NULL
  );
END;
$function$;

-- Add function to log auto-gift events
CREATE OR REPLACE FUNCTION public.log_auto_gift_event(
  user_uuid UUID,
  event_type_param TEXT,
  event_data_param JSONB DEFAULT '{}',
  metadata_param JSONB DEFAULT '{}',
  setup_token_param TEXT DEFAULT NULL,
  rule_id_param UUID DEFAULT NULL,
  execution_id_param UUID DEFAULT NULL,
  error_message_param TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.auto_gift_event_logs (
    user_id,
    event_type,
    setup_token,
    rule_id,
    execution_id,
    event_data,
    metadata,
    error_message,
    expires_at
  ) VALUES (
    user_uuid,
    event_type_param,
    setup_token_param,
    rule_id_param,
    execution_id_param,
    event_data_param,
    metadata_param,
    error_message_param,
    CASE 
      WHEN event_type_param LIKE '%setup%' THEN NOW() + INTERVAL '30 days'
      ELSE NOW() + INTERVAL '1 year'
    END
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;